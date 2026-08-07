import React from 'react'

import type { BulletinMode } from '../../queries/getSurfaceBulletin.ts'

/**
 * The bulletin's validity stamp — operational provenance furniture: when
 * this analysis was issued, the period it covers, what evidence it stands
 * on, and exactly what kind of data it is. The badge never softens:
 * authored fixture, synthetic fixture, or live evidence with freshness.
 */

const ANALYST_LINE: Record<BulletinMode, string> = {
  'authored-fixture': 'Currents (authored demonstration)',
  'derived-synthetic': 'Derived — currents v0 over demand markers',
  'derived-live': 'Derived — currents v0 over demand markers',
}

export function ValidityStamp({
  issued,
  period,
  mode,
  freshness,
}: {
  issued: string
  period: string
  mode: BulletinMode
  freshness?: 'fresh' | 'stale'
}) {
  const entries: Array<[string, string]> = [
    ['Issued', issued],
    ['Period', period],
    ['Basis', 'Demand · Semrush Analytics v3'],
    ['Analyst', ANALYST_LINE[mode]],
  ]

  const badge =
    mode === 'authored-fixture'
      ? { label: 'Fixture data', className: 'bg-red-text text-cream' }
      : mode === 'derived-synthetic'
        ? { label: 'Synthetic fixture', className: 'bg-red-text text-cream' }
        : {
            label: `Live evidence${freshness ? ` · ${freshness}` : ''}`,
            className: 'bg-charcoal text-cream',
          }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 border-b border-red/25 py-3">
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
              {label}
            </dt>
            <dd className="font-mono text-[11px] text-charcoal/80">{value}</dd>
          </div>
        ))}
      </dl>
      <span
        className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${badge.className}`}
      >
        {badge.label}
      </span>
    </div>
  )
}
