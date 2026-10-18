"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReasoningReveal } from "@/components/ReasoningReveal";
import { useReports, severityLabel } from "@/lib/report-context";
import { Textarea } from "@/components/ui/textarea";
import BoundingBoxOverlay, { MultiBoxOverlay } from "@/components/BoundingBoxOverlay";
import { SeverityBadge } from "@/components/severity-badge";
import { useToast } from "@/components/toast";

const NEIGHBORHOODS: Record<string, { lat: number; lon: number }> = {
  "New Delhi":  { lat: 28.6139, lon: 77.2090 },
  "Mumbai":     { lat: 19.0760, lon: 72.8777 },
  "Bangalore":  { lat: 12.9716, lon: 77.5946 },
  "Chennai":    { lat: 13.0827, lon: 80.2707 },
  "Kolkata":    { lat: 22.5726, lon: 88.3639 },
  "Hyderabad":  { lat: 17.3850, lon: 78.4867 },
  "Pune":       { lat: 18.5204, lon: 73.8567 },
  "Ahmedabad":  { lat: 23.0225, lon: 72.5714 },
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please upload a JPG, PNG, or WEBP image"
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Image must be under 10MB — try compressing it first"
  }
  return null
}

const DEFAULT_LAT = 21.1458 // Nagpur (Central India)
const DEFAULT_LON = 79.0882

interface Step { step: string; result: any; }

const PLACEHOLDER_STEPS = [
  { label: "Classifying issue...",           hint: "Identifying the category from the photo." },
  { label: "Checking nearby reports...",     hint: "Looking for duplicates within the area." },
  { label: "Assessing severity...",          hint: "Estimating urgency and public impact." },
  { label: "Drafting report and routing...", hint: "Preparing the case for the right department." },
];

const ESCALATION_MAP: Record<string, { body: string; escalation: string }> = {
  "Municipal Roads Department":  { body: "Municipal Corporation", escalation: "Commissioner of Roads" },
  "State Water Board":           { body: "State Water Board",     escalation: "MD Water Board" },
  "Local Electrical Department": { body: "Electricity Board",     escalation: "Chief Engineer" },
  "Municipal Sanitation":        { body: "Sanitation Dept",       escalation: "Zonal Commissioner" },
  "General Municipal Corporation": { body: "Municipal Corporation", escalation: "Municipal Commissioner" },
};
const DEFAULT_ESCALATION = { body: "Municipal Corporation", escalation: "Commissioner" };

export function UploadSection() {
  const router = useRouter();
  const { addConfirmedReport } = useReports();
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [preview, setPreview]             = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<Step[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [editedReportText, setEditedReportText] = useState<string>("");
  const [showConfirmPanel, setShowConfirmPanel] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [locationInput, setLocationInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeLat, setActiveLat] = useState(DEFAULT_LAT)
  const [activeLon, setActiveLon] = useState(DEFAULT_LON)
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [nominatimResults, setNominatimResults] = useState<
    { display_name: string; lat: string; lon: string; }[]
  >([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const nominatimDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Feature 1 — GPS
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationName, setLocationName] = useState("")

  // Feature 12 — Voice Input
  const [isListening, setIsListening] = useState(false)
  const [voiceNote, setVoiceNote] = useState("")
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceAvailable(!!SR)
  }, [])

  // Feature 15 — Share card state
  const [confirmedReport, setConfirmedReport] = useState<{
    category: string; location: string; severity: string; department: string;
  } | null>(null)

  const inputRef   = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => { timeoutIds.current.forEach(clearTimeout); };
  }, []);

  function clearPendingTimeouts() {
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file)
    if (validationError) {
      addToast(validationError, "error")
      return
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setAnalysisSteps([]);
    setAnalysisError(null);
    clearPendingTimeouts();
  }

  // Feature 1 — GPS Handler
  const handleGetLocation = () => {
    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setActiveLat(latitude)
        setActiveLon(longitude)
        setLocationConfirmed(true)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          setLocationName(data.display_name?.split(",").slice(0, 3).join(", ") ?? "Location detected")
        } catch {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
        setIsGettingLocation(false)
      },
      (err: GeolocationPositionError) => {
        setIsGettingLocation(false)
        const messages: Record<number, string> = {
          1: "Location access denied — select manually",
          2: "Location unavailable right now — select manually",
          3: "Location request timed out — select manually",
        }
        setLocationName(messages[err.code] ?? "Could not detect location — select manually")
      }
    )
  }

  const [recognitionRef, setRecognitionRef] = useState<any>(null);

  const handleVoiceInput = () => {
    // If currently listening, stop it manually
    if (isListening && recognitionRef) {
      try {
        recognitionRef.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      return;
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SR) {
      addToast('Voice input not supported in this browser — Chrome works best', 'info')
      return
    }

    // Check protocol
    const isSecure =
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (!isSecure) {
      addToast('Voice needs HTTPS — type your description below', 'info')
      return
    }

    try {
      const recognition = new SR()
      recognition.lang = 'en-US' // Fallback to a universally supported language
      recognition.continuous = false // Disable continuous to avoid silent timeouts on some platforms
      recognition.interimResults = true

      setRecognitionRef(recognition)

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onerror = (e: any) => {
        setIsListening(false)
        if (e.error === 'no-speech') {
          addToast('No speech detected. Microphone may be muted by system.', 'error')
        } else if (e.error === 'not-allowed') {
          addToast('Microphone access denied. Please allow it in browser settings.', 'error')
        } else {
          addToast(`Voice input error: ${e.error}`, 'error')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((result: any) => result[0].transcript)
          .join('')
        setVoiceNote(transcript)
      }


      recognition.start()
    } catch (err) {
      setIsListening(false)
      addToast('Could not start voice input — type your description', 'error')
    }
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      addToast("Please upload an image first", "error");
      return;
    }
    clearPendingTimeouts();
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSteps([]);

    const toBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    try {
      const imageBase64 = await toBase64(selectedFile);

      if (!imageBase64 || imageBase64.length < 100) {
        setAnalysisError("Image conversion failed — please try again");
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: selectedFile.type,
          lat: activeLat,
          lon: activeLon,
          existingReports: [],
          voiceNote: voiceNote || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text()
        addToast("Analysis failed — retrying", "error")
        throw new Error(errorText || `Analyze request failed with status ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Analyze response did not include a readable body')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      setAnalysisSteps([])

          const STEP_ORDER = ['classify', 'duplicate_check', 'severity_assessment', 'final_report']

          function upsertStep(stepName: string, result: unknown) {
            setAnalysisSteps((prev) => {
              const copy = [...prev]
              const idx = copy.findIndex((s: any) => s.step === stepName)
              const entry = { step: stepName, result }
              if (idx !== -1) {
                copy[idx] = entry
                return copy
              }
              const canonicalIndex = Math.max(0, Math.min(STEP_ORDER.length, STEP_ORDER.indexOf(stepName)))
              if (canonicalIndex >= 0 && canonicalIndex < STEP_ORDER.length) {
                let insertAt = copy.findIndex((s: any) => STEP_ORDER.indexOf(s.step) > canonicalIndex)
                if (insertAt === -1) insertAt = copy.length
                copy.splice(insertAt, 0, entry)
                return copy
              }
              copy.push(entry)
              return copy
            })
          }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let eventEndIndex = buffer.indexOf('\n\n')
        while (eventEndIndex !== -1) {
          const eventChunk = buffer.slice(0, eventEndIndex).trim()
          buffer = buffer.slice(eventEndIndex + 2)

          if (eventChunk) {
            const lines = eventChunk.split('\n')
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const payload = line.slice(6).trim()
              if (!payload || payload === '[DONE]') continue
              try {
                const event = JSON.parse(payload)
                if (event?.step && event?.result !== undefined) {
                  if (event.step === 'severity_retry') {
                    upsertStep('severity_assessment', { __retryMessage: event.result?.message })
                    continue
                  }
                  if (event.step === 'report_retry') {
                    upsertStep('final_report', { __retryMessage: event.result?.message })
                    continue
                  }
                  if (event.step === 'severity_streaming') {
                    setStreamingText(event.result?.full_text ?? "")
                    continue
                  }
                  upsertStep(event.step, event.result)
                  if (event.step === 'severity_assessment') {
                    setStreamingText("")
                  }

                  if (event.step === 'final_report') {
                    const finalReportText = event.result?.report?.reportText ?? event.result?.report?.text
                    if (typeof finalReportText === 'string') {
                      setEditedReportText(finalReportText)
                      setShowConfirmPanel(true)
                    }
                    // Feature 2 — Toast on analysis complete
                    addToast("Analysis complete", "success")
                  }
                }
              } catch {
                // Ignore malformed interim payloads
              }
            }
          }

          eventEndIndex = buffer.indexOf('\n\n')
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        const lines = buffer.trim().split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const event = JSON.parse(payload)
            if (event?.step && event?.result !== undefined) {
              setAnalysisSteps((prev) => [...prev, event])
            }
          } catch {
            // ignore
          }
        }
      }

      setIsAnalyzing(false)
    } catch (err) {
      const message = !navigator.onLine
        ? "You're offline — reconnect and try again"
        : String(err)
      setAnalysisError(message)
      addToast("Analysis failed", "error")
      setIsAnalyzing(false)
    }
  }

  const handleConfirmReport = () => {
    const step1Result = analysisSteps.find((s) => s.step === 'classify')?.result
    const step3Result = analysisSteps.find((s) => s.step === 'severity_assessment')?.result
    const step4ResultForUrgency = analysisSteps.find((s) => s.step === 'final_report')?.result
    const step4Result = analysisSteps.find((s) => s.step === 'final_report')?.result

    const category = step1Result?.category ?? 'other'
    const dept = step4Result?.report?.department ?? 'Municipal Corporation'
    const sevNum = step3Result?.urgencyScore ??
      step4ResultForUrgency?.urgencyScore ??
      parseInt(step3Result?.assessment?.match(/(\d)\/5/)?.[1] ?? "3", 10)
    const sevLabel = severityLabel(sevNum)

    const newReport = {
      id: crypto.randomUUID(),
      lat: activeLat,
      lon: activeLon,
      category: category,
      description: editedReportText,
      severity: sevLabel,
      report: editedReportText,
      timeAgo: 'Just now',
      status: 'reported' as const,
      department: dept,
      resolutionTimeEstimate: step3Result?.resolutionTimeEstimate ?? undefined,
      createdAt: new Date().toISOString(),
    }

    // Feature 15 — Store confirmed report details for share card
    setConfirmedReport({
      category,
      location: locationName || locationInput || "India",
      severity: String(sevNum),
      department: dept,
    })

    addConfirmedReport(newReport)
    // Feature 2 — Toast on confirm
    addToast("Report added to map", "success")
    setTimeout(() => router.push('/civic/map'), 1800)
    setShowConfirmPanel(false)
  }

  const handleDiscard = () => {
    setShowConfirmPanel(false)
    setEditedReportText("")
    setAnalysisSteps([])
    setSelectedFile(null)
    setPreview(null)
    setImgDims(null)
    setAnalysisError(null)
    setLocationInput("")
    setLocationName("")
    setActiveLat(DEFAULT_LAT)
    setActiveLon(DEFAULT_LON)
    setLocationConfirmed(false)
    setShowSuggestions(false)
    setVoiceNote("")
    setConfirmedReport(null)
    setNominatimResults([])
    if (nominatimDebounceRef.current) clearTimeout(nominatimDebounceRef.current)
    // Feature 2 — Toast on discard
    addToast("Report discarded", "info")
  }

  const step3Result = analysisSteps.find((s) => s.step === 'severity_assessment')?.result

  // Feature 9 — Confidence check
  const classifyResult = analysisSteps.find((s) => s.step === 'classify')?.result
  const confidence = classifyResult?.confidence ?? 1

  return (
    <section id="upload" className="mx-auto max-w-3xl px-5 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Feature 10 — card-hover on upload card */}
        <div className="rounded-2xl bg-white border border-[#E8E4DB] p-6 md:p-8 relative shadow-md-warm">
            <h2 className="mt-3 font-display text-3xl font-light text-ink">Show us what needs fixing</h2>

            <div
              onClick={() => inputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group overflow-hidden ${
                isDragging
                  ? 'border-[#5BBFBF] bg-[#5BBFBF]/5 scale-[1.01]'
                  : 'border-[#E8E4DB] bg-white hover:border-[#5BBFBF]/50 hover:bg-[#5BBFBF]/3'
              } mt-6 flex flex-col items-center justify-center px-6 py-12 text-center ${selectedFile ? 'iridescent-border' : ''}`}
              style={{ boxShadow: selectedFile ? 'inset 0 0 0 2px #5BBFBF' : undefined }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                const validationError = validateFile(file)
                if (validationError) {
                  addToast(validationError, "error")
                  return
                }
                setSelectedFile(file);
                setPreview(URL.createObjectURL(file));
                setAnalysisSteps([]);
                setAnalysisError(null);
                clearPendingTimeouts();
              }}
            >
              {/* Animated corner accents */}
              <div className="hidden sm:block absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#5BBFBF]/40 rounded-tl-lg
                transition-all duration-300 group-hover:border-[#5BBFBF] group-hover:w-6 group-hover:h-6" />
              <div className="hidden sm:block absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#5BBFBF]/40 rounded-tr-lg
                transition-all duration-300 group-hover:border-[#5BBFBF] group-hover:w-6 group-hover:h-6" />
              <div className="hidden sm:block absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#5BBFBF]/40 rounded-bl-lg
                transition-all duration-300 group-hover:border-[#5BBFBF] group-hover:w-6 group-hover:h-6" />
              <div className="hidden sm:block absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#5BBFBF]/40 rounded-br-lg
                transition-all duration-300 group-hover:border-[#5BBFBF] group-hover:w-6 group-hover:h-6" />
            {preview ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={preview}
                  alt="Selected"
                  className="max-h-48 rounded-lg object-contain"
                  onLoad={() => {
                    if (imgRef.current) {
                      setImgDims({
                        w: imgRef.current.clientWidth,
                        h: imgRef.current.clientHeight,
                      });
                    }
                  }}
                />
                {(() => {
                  type CR = { boundingBox?: { ymin:number; xmin:number; ymax:number; xmax:number }; severity?: number; category?: string; detections?: Array<{ boundingBox: { ymin:number; xmin:number; ymax:number; xmax:number }; category:string; confidence:number; severity:number }> };
                  const cr = analysisSteps.find((s) => s.step === 'classify')?.result as CR;
                  if (!imgDims) return null;
                  if (cr?.detections && cr.detections.length > 1) {
                    return (
                      <MultiBoxOverlay
                        detections={cr.detections}
                        imageWidth={imgDims.w}
                        imageHeight={imgDims.h}
                      />
                    );
                  }
                  const bbox = cr?.boundingBox ?? cr?.detections?.[0]?.boundingBox;
                  if (!bbox) return null;
                  return (
                    <BoundingBoxOverlay
                      box={bbox}
                      imageWidth={imgDims.w}
                      imageHeight={imgDims.h}
                      severity={cr?.severity ?? cr?.detections?.[0]?.severity ?? 3}
                      category={cr?.category ?? cr?.detections?.[0]?.category ?? 'issue'}
                    />
                  );
                })()}
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
                  <UploadCloud className="h-6 w-6 text-teal" aria-hidden="true" />
                </div>
                <p className="mt-4 font-sans text-sm font-medium text-ink">Drag and drop a photo, or click to browse</p>
                <p className="mt-1 font-sans text-xs text-ink-muted">JPG or PNG, up to 10MB</p>
              </>
            )}
            </div>
            <input
              id="file-upload"
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              tabIndex={-1}
              onChange={handleFileChange}
            />

            {/* Feature 9 — Low confidence warning */}
            <AnimatePresence>
              {analysisSteps.some((s) => s.step === 'classify') && confidence < 0.70 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg px-3 py-2 mt-2"
                >
                  ⚠ Low confidence ({Math.round(confidence * 100)}%) — try a closer photo with better lighting for more accurate results
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feature 12 — Voice input */}
            <div className="mt-3 space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#7A6A58]">
                Issue description (optional)
              </label>
              <div className="relative">
                <textarea
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder="Describe what you see — AI uses this alongside the photo..."
                  rows={2}
                  className="w-full rounded-xl border border-[#E8E4DB] bg-white px-4 py-3
                  font-sans text-sm text-[#1A1208] placeholder-[#7A6A58]
                  focus:border-[#5BBFBF] focus:outline-none focus:ring-1 focus:ring-[#5BBFBF]
                  resize-none pr-12"
                />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={isListening || voiceAvailable === false}
                  title={voiceAvailable === false ? "Use Chrome for voice input" : isListening ? "Listening…" : "Describe by voice"}
                  className={`absolute right-3 top-3 p-1.5 rounded-full transition-all
                    ${isListening
                      ? 'bg-[#E8957A]/15 text-[#E8957A]'
                      : voiceAvailable === false
                        ? 'bg-[#E8E4DB]/50 text-[#7A6A58] opacity-50 cursor-not-allowed'
                        : 'bg-[#5BBFBF]/10 text-[#5BBFBF] hover:bg-[#5BBFBF]/20'
                    }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
                {isListening && (
                  <span className="absolute right-3 top-3 rounded-full p-1.5
                    border-2 border-[#E8957A] animate-ping opacity-50 pointer-events-none" />
                )}
              </div>
              {isListening && (
                <p className="text-xs font-mono text-[#E8957A] animate-pulse">
                  🎙 Listening — speak now...
                </p>
              )}
            </div>

            {/* Feature 1 — GPS Location Input */}
            <div className="mt-5">
              <label htmlFor="location" className="font-mono text-xs uppercase tracking-[0.15em] text-ink-muted">Location</label>
              <div className="space-y-3 mt-2">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2 text-sm font-mono text-teal border border-teal/40 rounded-full px-4 py-2 hover:bg-teal/10 transition-colors w-full justify-center disabled:opacity-60"
                >
                  {isGettingLocation ? "Detecting location..." : "📍 Use My Location"}
                </button>
                {locationName && (
                  <p className="text-xs text-[#7A6A58] font-mono text-center">{locationName}</p>
                )}
                <p className="text-xs text-[#7A6A58] text-center">or select manually</p>
                {/* Existing dropdown — manual fallback */}
                <div className="relative">
                  <input
                    id="location"
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      const val = e.target.value
                      setLocationInput(val)
                      setLocationConfirmed(false)
                      setActiveLat(DEFAULT_LAT)
                      setActiveLon(DEFAULT_LON)
                      setNominatimResults([])
                  
                      if (nominatimDebounceRef.current) clearTimeout(nominatimDebounceRef.current)
                  
                      // First show instant local matches from NEIGHBORHOODS
                      setShowSuggestions(val.length >= 2)
                  
                      // Then after 400ms debounce, also fetch Nominatim results
                      if (val.length >= 3) {
                        nominatimDebounceRef.current = setTimeout(async () => {
                          setIsSearchingLocation(true)
                          try {
                            const res = await fetch(
                              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ', India')}&format=json&limit=5&countrycodes=in`,
                              { headers: { 'Accept-Language': 'en' } }
                            )
                            const data = await res.json()
                            setNominatimResults(Array.isArray(data) ? data : [])
                          } catch {
                            // Nominatim failed, local results still show
                          } finally {
                            setIsSearchingLocation(false)
                          }
                        }, 400)
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSuggestions(false)
                        setNominatimResults([])
                      }, 150)
                    }}
                    onFocus={() => locationInput.length >= 2 && setShowSuggestions(true)}
                    placeholder="Enter city or area in India..."
                    className="w-full rounded-lg border border-[#E6DDCF] bg-white px-4 py-2 font-mono text-sm text-[#1A1208] placeholder-[#5A6A58] focus:border-[#5BBFBF] focus:outline-none focus:ring-1 focus:ring-[#5BBFBF]"
                  />
                  {locationConfirmed && !locationName && (
                    <p className="mt-1 font-mono text-xs text-[#5BBFBF]">
                      📍 {locationInput}
                    </p>
                  )}
                  {showSuggestions && locationInput.length >= 2 && (() => {
                    const localMatches = Object.entries(NEIGHBORHOODS)
                      .filter(([name]) => name.toLowerCase().includes(locationInput.toLowerCase()))
                      .slice(0, 3)
                      .map(([name, coords]) => ({
                        label: name,
                        sublabel: 'Suggested location',
                        onSelect: () => {
                          setLocationInput(name)
                          setActiveLat(coords.lat)
                          setActiveLon(coords.lon)
                          setLocationName(name)
                          setLocationConfirmed(true)
                          setShowSuggestions(false)
                          setNominatimResults([])
                        }
                      }))
                  
                    const nominatimMatches = nominatimResults
                      .slice(0, 4)
                      .map((r) => ({
                        label: r.display_name.split(',').slice(0, 2).join(',').trim(),
                        sublabel: r.display_name.split(',').slice(2, 4).join(',').trim() || 'India',
                        onSelect: () => {
                          setLocationInput(r.display_name.split(',')[0].trim())
                          setActiveLat(parseFloat(r.lat))
                          setActiveLon(parseFloat(r.lon))
                          setLocationName(r.display_name.split(',')[0].trim())
                          setLocationConfirmed(true)
                          setShowSuggestions(false)
                          setNominatimResults([])
                        }
                      }))
                  
                    const allSuggestions = [...localMatches, ...nominatimMatches]
                    if (allSuggestions.length === 0 && !isSearchingLocation) return null
                  
                    return (
                      <ul className="absolute z-50 mt-1 w-full rounded-xl border border-[#E6DDCF] bg-white shadow-lg max-h-56 overflow-y-auto divide-y divide-[#F0EBE3]">
                        {isSearchingLocation && allSuggestions.length === 0 && (
                          <li className="px-4 py-3 text-xs font-mono text-[#7A6A58] flex items-center gap-2">
                            <span className="inline-block w-3 h-3 border border-[#5BBFBF] border-t-transparent rounded-full animate-spin" />
                            Searching...
                          </li>
                        )}
                        {allSuggestions.map((s, i) => (
                          <li
                            key={i}
                            onMouseDown={s.onSelect}
                            className="cursor-pointer px-4 py-2.5 hover:bg-[#FAF7F2] transition-colors"
                          >
                            <p className="font-mono text-sm text-[#1A1208] truncate">📍 {s.label}</p>
                            <p className="font-mono text-xs text-[#7A6A58] truncate mt-0.5">{s.sublabel}</p>
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              suppressHydrationWarning
              className="shimmer-btn mt-6 w-full rounded-full px-6 py-3 font-sans text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "Analyzing…" : "Analyze Issue"}
            </button>

            {analysisError && (
              <div className="mt-4 rounded-xl bg-[#FEF2EE] border border-[#E8957A]/30 px-4 py-3">
                <p className="font-sans text-sm text-[#E8957A]">{analysisError}</p>
              </div>
            )}
        </div>
      </motion.div>

      <div className="mt-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Agent Analysis</p>
        {analysisSteps.length > 0 ? (
          <>
            <ReasoningReveal steps={analysisSteps} streamingText={streamingText} />
            {showConfirmPanel && (
              <div className="mt-8 iridescent-border rounded-xl p-6 bg-[#FAF7F2]">

                <p className="font-mono text-xs uppercase tracking-widest text-[#5BBFBF] mb-4">
                  Human-in-the-loop review — confirm before submitting
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm font-mono text-[#7A6A58]">
                  <span>Category: <strong className="text-[#1A1208]">{analysisSteps.find((s) => s.step === 'classify')?.result?.category}</strong></span>
                  <span className="flex items-center gap-2">
                    Severity:
                    <SeverityBadge severity={severityLabel(
                      step3Result?.urgencyScore ??
                      parseInt(step3Result?.assessment?.match(/(\d)\/5/)?.[1] ?? "3", 10)
                    )} />
                  </span>
                  <span>Department: <strong className="text-[#1A1208]">{analysisSteps.find((s) => s.step === 'final_report')?.result?.report?.department}</strong></span>
                  <span>Location: <strong className="text-[#1A1208]">{locationName || locationInput || 'India (default)'}</strong></span>
                </div>

                {/* Feature 3 — Department Escalation Pills */}
                {(() => {
                  const escalationUrgency = parseInt(step3Result?.assessment?.match(/(\d)\/5/)?.[1] ?? "3", 10);
                  const escalationDepartment = analysisSteps.find((s) => s.step === 'final_report')?.result?.report?.department ?? "Municipal Corporation";
                  const escalationEntry = ESCALATION_MAP[escalationDepartment] ?? DEFAULT_ESCALATION;
                  const escalationColor = escalationUrgency >= 4 ? "#E8957A" : "#5BBFBF";
                  const pills = ["Report", escalationDepartment, escalationEntry.body, ...(escalationUrgency >= 4 ? [escalationEntry.escalation] : [])];
                  return (
                    <div className="flex items-center gap-1 flex-wrap mt-2 text-xs font-mono mb-4">
                      {pills.map((pill, i) => (
                        <span key={`${pill}-${i}`} className="flex items-center gap-1">
                          <span style={{ color: escalationColor }} className="border rounded-full px-2 py-0.5 border-current">
                            {pill}
                          </span>
                          {i < pills.length - 1 && <span className="text-[#7A6A58]">→</span>}
                        </span>
                      ))}
                    </div>
                  );
                })()}

                {step3Result?.resolutionTimeEstimate ? (
                  <p className="text-sm text-foreground/80 mt-1">
                    <span className="font-medium">Expected resolution:</span> {step3Result.resolutionTimeEstimate}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Timeline varies by department
                  </p>
                )}

                <Textarea
                  value={editedReportText}
                  onChange={(e) => setEditedReportText(e.target.value)}
                  className="w-full min-h-[120px] mb-4 mt-4 font-mono text-sm bg-white border-[#C9A84C] focus:ring-[#5BBFBF]"
                  placeholder="Edit the AI-drafted report before submitting..."
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmReport}
                    className="flex-1 py-2 px-4 shimmer-btn rounded-lg text-sm font-medium transition-opacity"
                  >
                    Confirm and Add to Map
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="py-2 px-4 rounded-lg text-sm font-medium text-[#7A6A58] border border-[#7A6A58] hover:bg-[#F0EBE3] transition-colors"
                  >
                    Discard
                  </button>
                </div>

                {/* Feature 15 — Shareable Report Card */}
                {confirmedReport && (
                  <div className="mt-4 rounded-xl border border-[#E8E4DB] bg-[#FAF7F2] p-4 space-y-2">
                    <p className="text-xs font-mono text-[#7A6A58] uppercase tracking-wider">
                      Share this report
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1208] truncate">
                          {confirmedReport.category} — {confirmedReport.location}
                        </p>
                        <p className="text-xs text-[#7A6A58]">
                          Severity: {confirmedReport.severity}/5 · {confirmedReport.department}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `I reported a civic issue via CivicPulse: ${confirmedReport.category} at ${confirmedReport.location}. Severity: ${confirmedReport.severity}/5. Routed to ${confirmedReport.department}. #CivicPulse #FixIndia`
                          )
                          addToast("Copied to clipboard!", "success")
                        }}
                        className="text-xs font-mono border border-teal/40 text-teal rounded-full px-3 py-1 hover:bg-teal/10 shrink-0 transition-colors"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {PLACEHOLDER_STEPS.map((step, i) => {
              const isActive = i === analysisSteps.length
              const isDone = i < analysisSteps.length
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: isDone || isActive ? 1 : 0.4, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all
                    ${isDone ? 'border-[#5BBFBF]/30 bg-[#5BBFBF]/5' :
                      isActive ? 'border-[#D4AF6A]/50 bg-[#D4AF6A]/5' :
                      'border-[#E8E4DB] bg-white/50'}`}
                >
                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs
                    ${isDone ? 'bg-[#5BBFBF] text-white' :
                      isActive ? 'border-2 border-[#D4AF6A] text-[#D4AF6A]' :
                      'border border-[#E8E4DB] text-[#E8E4DB]'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isDone ? 'text-[#1A1208]' : isActive ? 'text-[#1A1208]' : 'text-[#7A6A58]'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-[#7A6A58] mt-0.5">{step.hint}</p>
                  </div>
                  {isActive && (
                    <div className="ml-auto">
                      <div className="h-4 w-4 border-2 border-[#D4AF6A] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  );
}
