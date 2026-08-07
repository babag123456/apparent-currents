import React from 'react'

/**
 * The bulletin's validity stamp — operational-chart provenance furniture:
 * when this analysis was issued, the period it covers, what evidence it
 * stands on, and its fixture status. Modelled on the stamp block of a
 * surface analysis chart; becomes live provenance when real data lands.
 */
export function ValidityStamp({
  issued,
  period,
}: {
  issued: string
  period: string
}) {
  const entries: Array<[string, string]> = [
    ['Issued', issued],
    ['Period', period],
    ['Basis', 'Demand · Semrush Analytics v3'],
    ['Analyst', 'Currents (authored demonstration)'],
  ]

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
      <span className="ml-auto shrink-0 rounded-full bg-red-text px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-cream">
        Fixture data
      </span>
    </div>
  )
}
