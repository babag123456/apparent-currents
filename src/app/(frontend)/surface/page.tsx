import type { Metadata } from 'next'
import React from 'react'

import { CurrentRow } from '../../../features/currents/components/surface/CurrentRow.tsx'
import { MomentumPanel } from '../../../features/currents/components/surface/MomentumPanel.tsx'
import { ValidityStamp } from '../../../features/currents/components/surface/ValidityStamp.tsx'
import { SourceChip } from '../../../features/currents/components/SourceChip.tsx'
import { DEMO_BULLETIN } from '../../../features/currents/fixtures/demoCurrents.ts'

export const metadata: Metadata = { title: 'Surface · CURRENTS' }

/**
 * Surface — “What matters now.”
 * Lead analysis beside the stone momentum panel, the current table
 * (What’s moving), and the interpretation (So what). Fixture-led in this
 * phase; the validity stamp declares it.
 */
export default function SurfacePage() {
  const bulletin = DEMO_BULLETIN

  return (
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <ValidityStamp issued={bulletin.issued} period={bulletin.period} />

      {/* Lead analysis + momentum panel */}
      <section className="grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
        <div className="max-w-2xl">
          <h1 className="text-balance text-[2.35rem] font-medium leading-[1.06] tracking-[-0.02em] text-charcoal sm:text-[3.1rem]">
            {bulletin.lead.statement}
          </h1>
          <p className="mt-6 max-w-[62ch] text-[15px] leading-relaxed text-charcoal/75">
            {bulletin.lead.dek}
          </p>
          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-red-text">
            <span>Lead analysis</span>
            <span>· drawn from {bulletin.lead.basedOn.join(' + ')}</span>
            <span>· {bulletin.lead.confidence} confidence</span>
            <SourceChip source="semrush" connected />
            <span>· fixture</span>
          </p>
        </div>

        <div className="min-w-0">
          <MomentumPanel currents={bulletin.currents} />
        </div>
      </section>

      {/* What's moving — the current table */}
      <section aria-labelledby="whats-moving" className="pb-14">
        <div className="flex flex-col gap-1 border-b border-red pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2 id="whats-moving" className="text-[22px] font-medium tracking-[-0.01em] text-charcoal">
            What’s moving
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
            {bulletin.currents.length} currents · this period
          </span>
        </div>

        <div
          aria-hidden="true"
          className="hidden border-b border-charcoal/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-red-text sm:grid sm:grid-cols-[9rem_minmax(0,1fr)_10.5rem_9.5rem_6.5rem_2.25rem] sm:gap-x-4"
        >
          <span>Status</span>
          <span>Current</span>
          <span>Magnitude</span>
          <span>Momentum</span>
          <span>Confidence</span>
          <span />
        </div>

        <ul>
          {bulletin.currents.map((current) => (
            <CurrentRow key={current.id} current={current} />
          ))}
        </ul>

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
          <span>Select a current to open its markers · evidence:</span>
          <SourceChip source="semrush" connected />
          <SourceChip source="brandwatch" connected={false} />
          <SourceChip source="ga4" connected={false} />
          <SourceChip source="gwi" connected={false} />
        </p>
      </section>

      {/* So what — the interpretation */}
      <section aria-labelledby="so-what" className="pb-16">
        <div className="flex flex-col gap-1 border-b border-red pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2 id="so-what" className="text-[22px] font-medium tracking-[-0.01em] text-charcoal">
            So what
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
            Opportunities · where currents converge
          </span>
        </div>
        <div className="grid gap-6 pt-8 md:grid-cols-2">
          {bulletin.opportunities.map((opportunity) => (
            <article
              key={opportunity.id}
              className="rounded-2xl border border-red/30 p-6 sm:p-7"
            >
              <h3 className="text-[19px] font-medium leading-snug tracking-[-0.01em] text-charcoal">
                {opportunity.title}
              </h3>
              <p className="mt-3 max-w-[58ch] text-[14.5px] leading-relaxed text-charcoal/80">
                {opportunity.narrative}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
                Opportunity · convergence of {opportunity.convergesFrom.join(' + ')} ·{' '}
                <span className="text-red-text">fixture</span>
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Methodology foot */}
      <footer className="border-t border-red/25 py-8">
        <p className="max-w-[80ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
          Prepared by Currents · findings trace finding → markers → evidence → source ·
          demand evidence via Semrush Analytics v3 · conversation, behaviour and people
          sources not connected · this bulletin is an authored fixture demonstration —
          no live evidence was used
        </p>
      </footer>
    </div>
  )
}
