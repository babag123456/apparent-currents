import Link from 'next/link'
import React from 'react'

import { NavTabs } from './NavTabs.tsx'

/**
 * Product header: [Apparent logo] CURRENTS + primary navigation.
 * Brand rule: Apparent appears only as the supplied logo asset; the product
 * title is typeset as CURRENTS — never as an “Apparent Currents” wordmark.
 */
export function AppHeader() {
  return (
    <header className="border-b border-charcoal/12 bg-cream">
      <div className="mx-auto flex w-full max-w-7xl items-stretch justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/surface"
          className="flex items-center gap-3 py-3"
          aria-label="Currents home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/apparent-symbol-charcoal.svg"
            alt="Apparent"
            width={26}
            height={26}
            className="h-[26px] w-[26px]"
          />
          <span className="font-display text-[15px] font-semibold uppercase tracking-[0.16em] text-charcoal sm:text-[17px] sm:tracking-[0.22em]">
            Currents
          </span>
        </Link>
        <NavTabs />
      </div>
    </header>
  )
}
