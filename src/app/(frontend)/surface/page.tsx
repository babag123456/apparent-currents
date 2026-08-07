import type { Metadata } from 'next'
import React from 'react'

import { SourceChip } from '../../../features/currents/components/SourceChip.tsx'

export const metadata: Metadata = { title: 'Surface · CURRENTS' }

/**
 * Surface — “What matters now.”
 * Pre-data state: the fixture-led prototype lands in the next phase; until
 * then this states plainly what will appear here and what already exists.
 */
export default function SurfacePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-charcoal sm:text-5xl">
          Nothing surfaced yet.
        </h1>
        <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-charcoal/65">
          Surface opens with the currents that matter for this context — what’s
          emerging, what’s accelerating, what’s declining — each one traceable to
          the evidence behind it. Currents are derived from markers as evidence
          arrives; none have been derived yet.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <SourceChip source="semrush" connected={Boolean(process.env.SEMRUSH_API_KEY)} />
          <SourceChip source="brandwatch" connected={false} />
          <SourceChip source="ga4" connected={false} />
          <SourceChip source="gwi" connected={false} />
        </div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-charcoal/40">
          Evidence sources for this context
        </p>
      </div>
    </div>
  )
}
