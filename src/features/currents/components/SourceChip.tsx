import Link from 'next/link'
import React from 'react'

import type { EvidenceSource } from '../../../intelligence/evidence/types.ts'

const SOURCE_LABELS: Record<EvidenceSource, string> = {
  semrush: 'Semrush',
  brandwatch: 'Brandwatch',
  ga4: 'GA4',
  gwi: 'GWI',
}

/** Each source's home in the Deep Dive — where a linked chip lands. */
const LENS_ROUTE: Record<EvidenceSource, { href: string; lens: string }> = {
  semrush: { href: '/deep-dive/demand', lens: 'Demand' },
  brandwatch: { href: '/deep-dive/conversation', lens: 'Conversation' },
  ga4: { href: '/deep-dive/behaviour', lens: 'Behaviour' },
  gwi: { href: '/deep-dive/people', lens: 'People' },
}

/**
 * Compact provenance chip. Every displayed finding carries these so evidence
 * sources stay visible; unavailable sources render in a muted, explicit
 * “not connected” treatment — never faked as live. With `linked`, the chip
 * navigates to its lens in the Deep Dive (fixture data included), so
 * provenance is a door, not just a label — use it everywhere except on the
 * lens page the chip already describes.
 */
export function SourceChip({
  source,
  connected = true,
  linked = false,
}: {
  source: EvidenceSource
  connected?: boolean
  linked?: boolean
}) {
  const baseClasses = `inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
    connected
      ? 'bg-charcoal text-cream'
      : 'bg-transparent text-charcoal/70 outline outline-1 outline-charcoal/30'
  }`

  const label = (
    <>
      {SOURCE_LABELS[source]}
      {!connected && <span className="normal-case tracking-normal">· not connected</span>}
    </>
  )

  if (!linked) {
    return <span className={baseClasses}>{label}</span>
  }

  const route = LENS_ROUTE[source]
  return (
    <Link
      href={route.href}
      className={`${baseClasses} transition-colors ${
        connected
          ? 'hover:bg-red-text focus-visible:bg-red-text'
          : 'hover:text-red-text hover:outline-red-text focus-visible:text-red-text focus-visible:outline-red-text'
      }`}
    >
      {label}
      <span className="sr-only"> — open the {route.lens} lens</span>
    </Link>
  )
}
