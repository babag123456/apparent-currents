import React from 'react'

import type { EvidenceSource } from '../../../../intelligence/evidence/types.ts'
import { SourceChip } from '../SourceChip.tsx'

export interface MarkerRow {
  id: number | string
  statement: string
  kind: string
  magnitude: number
  confidence: string
  phrase: string
}

/** The markers list shared by every Deep Dive lens: statement in Inter
 * Tight, then the mono provenance line (kind · magnitude · confidence ·
 * phrase · source chip). */
export function MarkerList({
  markers,
  source,
  sourceConnected,
}: {
  markers: MarkerRow[]
  source: EvidenceSource
  sourceConnected: boolean
}) {
  return (
    <ul className="divide-y divide-charcoal/10">
      {markers.map((marker) => (
        <li key={marker.id} className="py-4">
          <p className="max-w-[70ch] text-[15px] font-medium leading-snug text-charcoal">
            {marker.statement}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal/70">
            <span>{marker.kind}</span>
            <span>
              · {marker.magnitude >= 0 ? '+' : ''}
              {Math.round(marker.magnitude * 100) / 100}
            </span>
            <span>· {marker.confidence} confidence</span>
            <span>· “{marker.phrase}”</span>
            <SourceChip source={source} connected={sourceConnected} />
          </p>
        </li>
      ))}
    </ul>
  )
}
