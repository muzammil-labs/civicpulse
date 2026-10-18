import 'server-only'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

// Suggests category, title and urgency for a resident's report from a photo and/or text.
// The resident always confirms; nothing is filed on the AI's word alone.

export const TriageResult = z.object({
  categoryKey: z.string(),
  title: z.string().max(140),
  description: z.string().max(600).optional().default(''),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  locationHint: z.string().max(120).optional().default(''),
  confidence: z.number().min(0).max(1),
})
export type TriageResult = z.infer<typeof TriageResult> & { source: 'ai' | 'rules' }

const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash']
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', te: 'Telugu', hi: 'Hindi' }

let client: GoogleGenAI | null = null
function getClient() {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  client ??= new GoogleGenAI({ apiKey: key })
  return client
}

export async function triageIssue(input: {
  imageBase64?: string
  text?: string
  locale: string
  categoryKeys: string[]
}): Promise<TriageResult> {
  const ai = getClient()
  if (!ai || process.env.MOCK_AI === 'true' || (!input.imageBase64 && !input.text)) {
    return ruleBasedTriage(input.text ?? '', input.categoryKeys)
  }

  const language = LANGUAGE_NAMES[input.locale] ?? 'English'
  const prompt = `You help residents of an Indian gated community report maintenance problems to their committee.
Look at the photo and/or the resident's note and respond with JSON only:
{"categoryKey": one of ${JSON.stringify(input.categoryKeys)},
 "title": short title (max 10 words) in ${language},
 "description": one factual sentence about what is visible, in ${language},
 "urgency": "low" | "medium" | "high" | "critical"  (critical = safety risk now, e.g. person stuck in lift, sparking wires, flooding, fire),
 "locationHint": where it seems to be (e.g. "lift lobby", "parking basement") or "",
 "confidence": 0 to 1}
Do not identify people. If the photo is not a maintenance problem, use "other" with low confidence.
Resident's note: ${JSON.stringify(input.text ?? '')}`

  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = []
  if (input.imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: input.imageBase64 } })
  parts.push({ text: prompt })

  for (const model of MODELS) {
    try {
      const res = await withTimeout(
        ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
        12_000,
      )
      const raw = res.text ?? ''
      const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1))
      const parsed = TriageResult.parse(json)
      if (!input.categoryKeys.includes(parsed.categoryKey)) parsed.categoryKey = 'other'
      return { ...parsed, source: 'ai' }
    } catch (err) {
      console.warn(`[triage] ${model} failed:`, err instanceof Error ? err.message : err)
    }
  }
  return ruleBasedTriage(input.text ?? '', input.categoryKeys)
}

// Free, offline fallback used for demos, without an API key, or when the AI is unavailable.
const KEYWORDS: [string, RegExp, 'low' | 'medium' | 'high' | 'critical'][] = [
  ['lift', /lift|elevator|लिफ्ट|లిఫ్ట్/i, 'high'],
  ['water_supply', /no water|water supply|tank|पानी नहीं|నీళ్ళు రావడం|నీటి సరఫరా/i, 'high'],
  ['plumbing', /leak|pipe|tap|drain|seepage|plumb|रिसाव|లీక్/i, 'medium'],
  ['electrical', /light|power|electric|switch|spark|wire|bulb|बिजली|లైట్|విద్యుత్/i, 'medium'],
  ['security', /gate|guard|security|barrier|cctv|सुरक्षा|గేట్/i, 'high'],
  ['housekeeping', /garbage|trash|dirty|clean|bin|smell|कचरा|చెత్త/i, 'medium'],
  ['parking', /park|car|bike|vehicle|पार्किंग|పార్కింగ్/i, 'low'],
  ['pest_control', /cockroach|rat|mosquito|pest|termite|कीट|దోమ/i, 'low'],
  ['civil', /crack|wall|ceiling|plaster|tile|दरार|పగుళ్లు/i, 'medium'],
  ['noise', /noise|loud|music|शोर|శబ్దం/i, 'low'],
  ['common_area', /pool|gym|clubhouse|garden|play|park area/i, 'medium'],
]

export function ruleBasedTriage(text: string, categoryKeys: string[]): TriageResult {
  const match = KEYWORDS.find(([key, re]) => categoryKeys.includes(key) && re.test(text))
  const critical = /stuck|trapped|spark|fire|smoke|flood|shock|फँस|అగ్ని/i.test(text)
  return {
    categoryKey: match?.[0] ?? 'other',
    title: text.trim().slice(0, 80),
    description: '',
    urgency: critical ? 'critical' : (match?.[2] ?? 'medium'),
    locationHint: '',
    confidence: match ? 0.5 : 0.1,
    source: 'rules',
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms)),
  ])
}
