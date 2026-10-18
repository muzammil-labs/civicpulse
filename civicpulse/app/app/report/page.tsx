import type { Metadata } from 'next'
import { requireMember } from '@/lib/session'
import { getT } from '@/lib/i18n/server'
import { getBlocks, getCategories } from '@/lib/queries'
import { ReportForm } from './report-form'

export const metadata: Metadata = { title: 'Report an issue' }

export default async function ReportPage() {
  const { supabase, org, profile } = await requireMember()
  const { locale, t } = await getT(profile?.locale)
  const [categories, blocks] = await Promise.all([getCategories(supabase, org.id), getBlocks(supabase, org.id)])

  return (
    <div>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">{t('report.title')}</h1>
      <ReportForm orgId={org.id} categories={categories} blocks={blocks} locale={locale} />
    </div>
  )
}
