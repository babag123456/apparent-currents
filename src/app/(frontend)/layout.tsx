import type { Metadata } from 'next'
import React from 'react'

import '../../styles/brand.css'

import { AppHeader } from '../../features/currents/components/AppHeader.tsx'
import { ContextBar } from '../../features/currents/components/ContextBar.tsx'
import { DEMO_CONTEXT } from '../../features/currents/fixtures/demoContext.ts'

export const metadata: Metadata = {
  title: 'CURRENTS',
  description: 'Audience-intent intelligence by Apparent.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-image-preview': 'none',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased app-body" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-charcoal focus:px-3 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>
        <AppHeader />
        <ContextBar context={DEMO_CONTEXT} />
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
