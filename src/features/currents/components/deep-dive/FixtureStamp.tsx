import React from 'react'

/**
 * The provenance strip for a fixture-only lens: context, seed date and
 * the SYNTHETIC FIXTURE badge. Honesty furniture — this is what stops
 * authored data reading as live evidence.
 */
export function FixtureStamp({
  contextName,
  seededAt,
  isDemo,
}: {
  contextName: string
  seededAt: string
  isDemo: boolean
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1.5 border-b border-red/25 py-3">
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
        <div className="flex items-baseline gap-2">
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
            Context
          </dt>
          <dd className="font-mono text-[11px] text-charcoal/80">{contextName}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
            Seeded
          </dt>
          <dd className="font-mono text-[11px] text-charcoal/80">
            {new Date(seededAt).toLocaleString('en-AU', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </dd>
        </div>
        {isDemo ? (
          <div className="flex items-baseline gap-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
              Status
            </dt>
            <dd className="font-mono text-[11px] uppercase tracking-[0.1em] text-charcoal/80">
              demo context
            </dd>
          </div>
        ) : null}
      </dl>
      <span className="ml-auto shrink-0 rounded-full bg-red-text px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-cream">
        Synthetic fixture
      </span>
    </div>
  )
}
