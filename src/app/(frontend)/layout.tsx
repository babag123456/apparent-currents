import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import React from 'react'

import '../../styles/award-theme.css'

export const metadata: Metadata = {
  title: 'thisisour.agency',
  description: 'Creative work and award submissions managed through Payload CMS.',
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
      <body className="antialiased award-kit-body" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
