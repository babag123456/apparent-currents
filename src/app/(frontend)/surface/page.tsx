import type { Metadata } from 'next'
import React from 'react'

import { CurrentRow } from '../../../features/currents/components/surface/CurrentRow.tsx'
import { MomentumPanel } from '../../../features/currents/components/surface/MomentumPanel.tsx'
import { ValidityStamp } from '../../../features/currents/components/surface/ValidityStamp.tsx'
import { SourceChip } from '../../../features/currents/components/SourceChip.tsx'
import { getSurfaceBulletin } from '../../../features/currents/queries/getSurfaceBulletin.ts'

export const metadata: Metadata = { title: 'Currents · Surface' }
export const dynamic = 'force-dynamic'

/**
 * Surface — “What matters now.”
 * Lead analysis beside the stone momentum panel, the current table
 * (What’s moving), and the interpretation (So what). Renders derived
 * currents from stored markers when an import exists, otherwise the
 * authored fixture bulletin — the validity stamp always says which.
 */
export default async function SurfacePage() {
  const bulletin = await getSurfaceBulletin()
  const { mode } = bulletin

  const provenanceLabel =
    mode === 'authored-fixture' ? 'fixture' : mode === 'derived-synthetic' ? 'synthetic fixture' : 'live'
  const dataLabel =
    mode === 'authored-fixture' ? 'Fixture' : mode === 'derived-synthetic' ? 'Synthetic' : 'Live'
  const panelFootnote =
    mode === 'authored-fixture'
      ? 'Relative search-demand index per current · 12 weeks · authored fixture, not live evidence'
      : mode === 'derived-synthetic'
        ? 'Volume-weighted demand index per derived current · synthetic fixture evidence, no live data'
        : 'Volume-weighted demand index per derived current · live imported evidence'
  const leadLabel = mode === 'authored-fixture' ? 'Lead analysis' : 'Derived lead'

  return (
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <ValidityStamp
        issued={bulletin.issued}
        period={bulletin.period}
        mode={mode}
        freshness={bulletin.provenance?.freshness}
      />

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
            <span>{leadLabel}</span>
            <span>· drawn from {bulletin.lead.basedOn.join(' + ')}</span>
            <span>· {bulletin.lead.confidence} confidence</span>
            <SourceChip source="semrush" connected linked />
            <span>· {provenanceLabel}</span>
          </p>
        </div>

        <div className="min-w-0">
          <MomentumPanel
            currents={bulletin.currents}
            dataLabel={dataLabel}
            footnote={panelFootnote}
          />
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
            {mode === 'authored-fixture' ? '' : ' · machine-derived'}
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
            <CurrentRow key={current.id} current={current} provenanceLabel={provenanceLabel} />
          ))}
        </ul>

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
          <span>Select a current to open its markers · evidence:</span>
          <SourceChip source="semrush" connected linked />
          <SourceChip source="brandwatch" connected={false} linked />
          <SourceChip source="ga4" connected={false} linked />
          <SourceChip source="gwi" connected={false} linked />
          {bulletin.provenance && bulletin.provenance.unclusteredCount > 0 ? (
            <span>
              · {bulletin.provenance.unclusteredCount} thin signal
              {bulletin.provenance.unclusteredCount === 1 ? '' : 's'} below the pattern
              threshold — see Deep Dive
            </span>
          ) : null}
          {bulletin.provenance && bulletin.provenance.corroboratingCount > 0 ? (
            <span>
              · {bulletin.provenance.corroboratingCount} corroborating marker
              {bulletin.provenance.corroboratingCount === 1 ? '' : 's'} from{' '}
              {bulletin.provenance.corroboratingLenses.join(' + ')} in the annexes
            </span>
          ) : null}
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
        {bulletin.opportunities.length > 0 ? (
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
                  <span className="text-red-text">
                    {mode === 'authored-fixture'
                      ? 'fixture'
                      : mode === 'derived-synthetic'
                        ? 'authored interpretation · synthetic fixture'
                        : 'authored interpretation'}
                  </span>
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-charcoal/20 p-6 sm:p-7">
            <h3 className="text-[17px] font-medium text-charcoal">
              No opportunities authored for this import yet
            </h3>
            <p className="mt-2 max-w-[66ch] text-[14px] leading-relaxed text-charcoal/75">
              Opportunities are strategic interpretation — where currents converge into
              something worth acting on. They are authored by strategists, never
              generated automatically, so a fresh import starts with the currents above
              and an empty page here.
            </p>
          </div>
        )}
      </section>

      {/* Methodology foot */}
      <footer className="border-t border-red/25 py-8">
        <p className="max-w-[80ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
          Prepared by Currents · findings trace finding → markers → evidence → source ·
          demand evidence via Semrush Analytics v3 · conversation, behaviour and people
          sources not connected ·{' '}
          {mode === 'authored-fixture'
            ? 'this bulletin is an authored fixture demonstration — no live evidence was used'
            : mode === 'derived-synthetic'
              ? `currents machine-derived from ${bulletin.provenance?.markerCount ?? 0} markers over authored synthetic evidence — no live data was fetched`
              : `currents machine-derived from ${bulletin.provenance?.markerCount ?? 0} markers over ${bulletin.provenance?.evidenceCount ?? 0} live evidence records · ${bulletin.provenance?.estimatedUnits ?? 0} api units`}
          {bulletin.provenance && bulletin.provenance.corroboratingCount > 0
            ? ` · ${bulletin.provenance.corroboratingCount} corroborating fixture markers from ${bulletin.provenance.corroboratingLenses.join(' + ')} — corroboration never alters momentum, status or confidence`
            : ''}
        </p>
      </footer>
    </div>
  )
}
