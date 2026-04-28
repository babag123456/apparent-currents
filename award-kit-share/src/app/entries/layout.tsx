import type { Metadata } from 'next'
import React from 'react'

import '../../styles/award-theme.css'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function EntriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="antialiased award-kit-body" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
