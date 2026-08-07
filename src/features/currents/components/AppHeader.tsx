import Link from 'next/link'
import React from 'react'

import { NavTabs } from './NavTabs.tsx'

/**
 * Product header in the Apparent site grammar: the supplied lockup asset
 * (logomark + wordmark, red on cream) with the product name Currents
 * typeset in Inter Tight beside it. Brand rule: Apparent appears only as
 * supplied logo assets — never retypeset, never combined into a new logo.
 */
export function AppHeader() {
  return (
    <header className="border-b border-red/25 bg-cream">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-8">
        <Link
          href="/surface"
          className="flex shrink-0 items-center gap-2.5 sm:gap-4"
          aria-label="Currents home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/apparent-lockup-red.svg"
            alt="Apparent"
            width={122}
            height={27}
            className="h-[22px] w-auto sm:h-[27px]"
          />
          <span className="text-[16px] font-medium tracking-[-0.01em] text-charcoal sm:text-[19px]">
            Currents
          </span>
        </Link>
        <NavTabs />
      </div>
    </header>
  )
}
