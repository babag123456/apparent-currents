import type { Metadata } from 'next'
import React from 'react'

import '../../styles/brand.css'

import { AppHeader } from '../../features/currents/components/AppHeader.tsx'
import { AskDock } from '../../features/currents/components/ask/AskDock.tsx'
import { ContextBar } from '../../features/currents/components/ContextBar.tsx'

export const metadata: Metadata = {
  title: 'Currents',
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

const DIRECTION_CONTRACT = `<!--
THESIS: Apparent's own red editorial-terminal system carrying an
intelligence product - insight leads, evidence one step behind; refuses the
blue-SaaS dashboard and the decorative-metaphor chart.
OWN-WORLD: Cream ground with red as the working colour: DM Mono uppercase
labels, hairline red rules, pill chips and controls, Inter Tight voice
(Swiss Posters retired); data lives in rounded stone terminal panels
with red numerics, a softened take on the LED market-board photography
of the Apparent site.
STORY: A strategist reads the lead analysis, scans momentum on the panel,
expands a current to its markers, and can say the finding aloud in a
client meeting.
FIRST VIEWPORT: Red mono validity strip, lockup + Currents header, lead
statement in Inter Tight beside the stone momentum panel; the current
table begins in view.
FORM: Apparent red terminal (user-pinned, third steer); seed 07e29135.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md
-->`

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased app-body" suppressHydrationWarning>
        <span hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-charcoal focus:px-3 focus:py-2 focus:text-cream"
        >
          Skip to content
        </a>
        <AppHeader />
        <ContextBar />
        <main id="main">{children}</main>
        <AskDock />
      </body>
    </html>
  )
}
