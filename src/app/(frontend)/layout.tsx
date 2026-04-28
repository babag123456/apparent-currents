import type { Metadata } from 'next'
import React from 'react'

import '../../styles/award-theme.css'

export const metadata: Metadata = {
  title: 'thisisour.agency',
  description: 'Creative work and award submissions managed through Payload CMS.',
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
      </body>
    </html>
  )
}
