import type { Metadata } from 'next'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { ReportProvider } from '@/lib/report-context'
import { ToastProvider } from '@/components/toast'
import { ErrorBoundary } from '@/components/error-boundary'
import { OfflineBanner } from '@/components/offline-banner'
import { brand } from '@/lib/brand'

export const metadata: Metadata = {
  title: { default: `${brand.civicName} — Report it. Watch it act.`, template: `%s · ${brand.civicName}` },
  description: `${brand.civicName} turns a photo and a location into a routed civic report for roads, streetlights, water and waste.`,
}

// Civic mode: public road and civic issue reporting, kept separate from the community product.
export default function CivicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <OfflineBanner />
      <ErrorBoundary>
        <ReportProvider>
          <ToastProvider>
            <div className="page-enter">{children}</div>
          </ToastProvider>
        </ReportProvider>
      </ErrorBoundary>
    </div>
  )
}
