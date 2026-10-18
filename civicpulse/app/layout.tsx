import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono, Noto_Sans_Devanagari, Noto_Sans_Telugu } from 'next/font/google'
import './globals.css'
import { brand } from '@/lib/brand'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
})

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
})

const notoTelugu = Noto_Sans_Telugu({
  variable: '--font-telugu',
  subsets: ['telugu'],
  weight: ['400', '500', '600'],
})

const notoDevanagari = Noto_Sans_Devanagari({
  variable: '--font-devanagari',
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — the operating system for gated communities`,
    template: `%s · ${brand.name}`,
  },
  description:
    'Residents report issues with a photo. Committees get one clear queue, proof that work was done, and reports ready for the AGM.',
  applicationName: brand.name,
}

export const viewport: Viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${notoTelugu.variable} ${notoDevanagari.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
