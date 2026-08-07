import type { Metadata } from 'next'
import React from 'react'

import { SourceChip } from '../../../../features/currents/components/SourceChip.tsx'

export const metadata: Metadata = { title: 'Demand · Deep Dive · CURRENTS' }

/**
 * Demand lens — powered by Semrush.
 * Two designed pre-data states, chosen by real configuration:
 *  - Semrush key missing → how to connect, without pretending anything works
 *  - key present, nothing fetched yet → what an import will produce
 * Live evidence wiring lands in a later phase.
 */
export default function DemandPage() {
  const semrushConfigured = Boolean(process.env.SEMRUSH_API_KEY)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-charcoal">
          Demand
        </h1>
        <SourceChip source="semrush" connected={semrushConfigured} />
      </div>
      <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/60">
        What this audience is actively looking for: search volumes, movement over
        time, related and emerging queries, and how demand splits across the
        competitive set.
      </p>

      {semrushConfigured ? (
        <div className="mt-10 border-t border-charcoal/12 pt-8">
          <h2 className="text-lg font-medium text-charcoal">No demand evidence imported yet</h2>
          <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/60">
            Semrush is connected. The first import for this context will fetch a
            keyword overview for the topic set, related queries, and organic
            keywords for the competitive set — cached, timestamped, and metered
            in API units. Import controls arrive with the data-wiring phase.
          </p>
        </div>
      ) : (
        <div className="mt-10 border-t border-charcoal/12 pt-8">
          <h2 className="text-lg font-medium text-charcoal">Semrush isn’t connected</h2>
          <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/60">
            Demand evidence comes from the Semrush Analytics API, which needs a
            server-side key. Add <code className="font-mono text-[13px]">SEMRUSH_API_KEY</code> to{' '}
            <code className="font-mono text-[13px]">.env</code> and restart the app. The key stays
            on the server — it is never exposed to the browser, committed, or logged.
          </p>
          <p className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/60">
            Then verify the connection with one small metered request:{' '}
            <code className="font-mono text-[13px]">npx tsx scripts/semrush-probe.ts “ev charging” au</code>
          </p>
        </div>
      )}
    </div>
  )
}
