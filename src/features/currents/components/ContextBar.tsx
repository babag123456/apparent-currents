import React from 'react'

import type { AnalysisContext } from '../fixtures/demoContext.ts'

/**
 * Persistent analysis-context bar. Read-only for now: it displays the
 * fixture context and says so. Editable saved contexts arrive with the
 * Payload storage layer.
 */
export function ContextBar({ context }: { context: AnalysisContext }) {
  const entries: Array<[string, string]> = [
    ['Brand', context.brand],
    ['Category', context.category],
    ['Market', context.market],
    ['Audience', context.audience],
    ['Period', context.period],
    ['Competitors', context.competitors.join(' · ')],
  ]

  return (
    <div className="border-b border-charcoal/12 bg-stone/40">
      <div className="mx-auto flex w-full max-w-7xl items-baseline gap-x-7 gap-y-1 overflow-x-auto px-5 py-2.5 sm:flex-wrap sm:px-8">
        <dl className="contents">
          {entries.map(([label, value]) => (
            <div key={label} className="flex shrink-0 items-baseline gap-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-charcoal/45">
                {label}
              </dt>
              <dd className="whitespace-nowrap text-[13px] font-medium text-charcoal">{value}</dd>
            </div>
          ))}
        </dl>
        <span className="ml-auto shrink-0 rounded-sm bg-charcoal/8 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/55">
          Demo context
        </span>
      </div>
    </div>
  )
}
