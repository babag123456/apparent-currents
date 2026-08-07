'use client'

import React, { useId, useState } from 'react'

import type { FixtureCurrent } from '../../fixtures/demoCurrents.ts'
import { SourceChip } from '../SourceChip.tsx'
import { StatusMark } from './StatusMark.tsx'

/**
 * One current in the table: status pill · finding · magnitude · momentum ·
 * confidence, expanding into its markers (the evidence trail). The whole
 * header row is the disclosure control; the red circle is the site's
 * action affordance.
 */

function DirectionArrow({ direction }: { direction: FixtureCurrent['direction'] }) {
  const d =
    direction === 'rising' ? 'M2 12 L12 2 M6 2 L12 2 L12 8' :
    direction === 'easing' ? 'M2 2 L12 12 M12 6 L12 12 L6 12' :
    'M2 7 L12 7 M8 3 L12 7 L8 11'
  return (
    <svg viewBox="0 0 14 14" width={12} height={12} aria-hidden="true" className="shrink-0">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Mechanical cross-lens tally: counts of corroborating / cutting-against /
 * context markers among the annex's cross-lens evidence. Worded counts
 * only — alignment is never folded into a score or a confidence change.
 */
function AlignmentSummary({ markers }: { markers: FixtureCurrent['markers'] }) {
  const aligned = markers.filter((marker) => marker.alignment)
  if (aligned.length === 0) return null
  const counts = {
    corroborates: aligned.filter((m) => m.alignment === 'corroborates').length,
    cutsAgainst: aligned.filter((m) => m.alignment === 'cuts against').length,
    context: aligned.filter((m) => m.alignment === 'context').length,
  }
  const parts = [
    counts.corroborates > 0 ? `${counts.corroborates} corroborate the direction` : null,
    counts.cutsAgainst > 0 ? `${counts.cutsAgainst} cut against it` : null,
    counts.context > 0 ? `${counts.context} add context` : null,
  ].filter(Boolean)
  return (
    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
      Cross-lens alignment: {parts.join(' · ')}
    </p>
  )
}

export function CurrentRow({
  current,
  provenanceLabel,
}: {
  current: FixtureCurrent
  /** Honest data label on every marker line: 'fixture', 'synthetic fixture', 'live'. */
  provenanceLabel: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <li className="border-b border-charcoal/10">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-2 px-3 py-5 text-left transition-colors hover:bg-stone/30 sm:grid-cols-[9rem_minmax(0,1fr)_10.5rem_9.5rem_6.5rem_2.25rem] sm:items-start sm:px-4"
      >
        <span className="flex items-baseline gap-3 sm:flex-col sm:items-start sm:gap-2">
          <span className="font-mono text-[11px] tracking-[0.08em] text-charcoal/70">
            {current.id}
          </span>
          <StatusMark status={current.status} />
        </span>

        <span className="col-span-2 min-w-0 sm:col-span-1">
          <span className="block text-[16px] font-medium leading-snug text-charcoal">
            {current.title}
          </span>
          <span className="mt-1 block max-w-[58ch] text-[13.5px] leading-relaxed text-charcoal/70">
            {current.summary}
          </span>
        </span>

        <span className="min-w-0 font-mono text-[11px] leading-relaxed text-charcoal/75">
          <span className="sr-only">Magnitude: </span>
          {current.magnitude}
        </span>

        <span className="flex items-center gap-1.5 font-mono text-[11px] text-red-text">
          <span className="sr-only">Momentum: </span>
          <DirectionArrow direction={current.direction} />
          {current.momentum}
        </span>

        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-charcoal/75">
          <span className="sr-only">Confidence: </span>
          {current.confidence}
        </span>

        <span
          aria-hidden="true"
          className={`flex h-6 w-6 items-center justify-center place-self-start justify-self-end rounded-full bg-red text-cream transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-45' : ''}`}
        >
          <svg viewBox="0 0 12 12" width={10} height={10}>
            <path d="M6 1.5 V10.5 M1.5 6 H10.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-charcoal/10 bg-stone/25 px-3 py-5 sm:px-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
              Markers — the evidence behind {current.id}
            </p>
            <AlignmentSummary markers={current.markers} />
            <ul className="mt-4 space-y-4 sm:ml-[9rem]">
              {current.markers.map((marker) => (
                <li key={marker.metric} className="max-w-[72ch]">
                  <p className="text-[14px] font-medium leading-snug text-charcoal">
                    {marker.statement}
                  </p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-charcoal/75">
                    {marker.metric}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal/70">
                    <SourceChip source={marker.source} connected={marker.sourceConnected ?? true} />
                    <span>{marker.sourceReport}</span>
                    <span>· {marker.confidence} confidence</span>
                    {marker.alignment ? (
                      <span className={marker.alignment === 'cuts against' ? 'text-plum' : undefined}>
                        · {marker.alignment}
                      </span>
                    ) : null}
                    <span className="text-red-text">· {marker.provenanceLabel ?? provenanceLabel}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </li>
  )
}
