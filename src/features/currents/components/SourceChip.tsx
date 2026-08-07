import React from 'react'

import type { EvidenceSource } from '../../../intelligence/evidence/types.ts'

const SOURCE_LABELS: Record<EvidenceSource, string> = {
  semrush: 'Semrush',
  brandwatch: 'Brandwatch',
  ga4: 'GA4',
  gwi: 'GWI',
}

/**
 * Compact provenance chip. Every displayed finding carries these so evidence
 * sources stay visible; unavailable sources render in a muted, explicit
 * “not connected” treatment — never faked as live.
 */
export function SourceChip({
  source,
  connected = true,
}: {
  source: EvidenceSource
  connected?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
        connected
          ? 'bg-charcoal text-cream'
          : 'bg-transparent text-charcoal/70 outline outline-1 outline-charcoal/30'
      }`}
    >
      {SOURCE_LABELS[source]}
      {!connected && <span className="normal-case tracking-normal">· not connected</span>}
    </span>
  )
}
