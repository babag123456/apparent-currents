import type { Metadata } from 'next'
import React from 'react'

import { FixtureStamp } from '../../../../features/currents/components/deep-dive/FixtureStamp.tsx'
import { MarkerList } from '../../../../features/currents/components/deep-dive/MarkerList.tsx'
import { Notice } from '../../../../features/currents/components/deep-dive/Notice.tsx'
import { SectionHead } from '../../../../features/currents/components/deep-dive/SectionHead.tsx'
import { SourceChip } from '../../../../features/currents/components/SourceChip.tsx'
import { getLensFixture } from '../../../../features/currents/queries/getLensFixture.ts'

export const metadata: Metadata = { title: 'People · Deep Dive · CURRENTS' }
export const dynamic = 'force-dynamic'

/**
 * People lens — who the audience is and what they care about. GWI is not
 * connected and no adapter exists yet; everything shown here is authored
 * synthetic fixture data, stamped as such at every level. Aggregate
 * audience attributes only — never person-level.
 */
export default async function PeoplePage() {
  const data = await getLensFixture('people')

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-charcoal">
          People
        </h1>
        <SourceChip source="gwi" connected={false} />
      </div>
      <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/70">
        Who this audience is and what they care about: stated attitudes and
        attributes, how strongly they over- or under-index against the
        national average, and what share of the audience holds each one.
      </p>

      {!data?.sync ? (
        <Notice tone="info" title="GWI isn’t connected">
          <p>
            People evidence will come from the GWI platform; no adapter exists
            yet. To explore this lens with authored synthetic data, seed the
            fixture locally with{' '}
            <code className="font-mono text-[13px]">npx tsx scripts/seed-lens-fixtures.ts</code> —
            it is labelled synthetic everywhere it appears.
          </p>
        </Notice>
      ) : (
        <>
          <FixtureStamp
            contextName={data.context.name}
            seededAt={data.sync.finishedAt as string}
            isDemo={Boolean(data.context.isDemo)}
          />

          <section aria-labelledby="people-markers" className="mt-12">
            <SectionHead
              id="people-markers"
              title="Markers"
              note={`${data.markers.length} authored · synthetic fixture`}
            />
            <MarkerList markers={data.markers} source="gwi" sourceConnected={false} />
          </section>

          <section aria-labelledby="people-evidence" className="mt-12 pb-4">
            <SectionHead
              id="people-evidence"
              title="Evidence"
              note={`${data.evidence.length} attributes · synthetic fixture`}
            />
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-labelledby="people-evidence"
            >
              <table className="mt-1 w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-charcoal/10 font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                    <th scope="col" className="py-2.5 pr-4 font-medium">Attribute</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">Index</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">Audience share</th>
                    <th scope="col" className="py-2.5 font-medium">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evidence.map((record) => (
                    <tr key={record.id} className="border-b border-charcoal/10">
                      <td className="py-2.5 pr-4 text-[14px] font-medium text-charcoal">
                        {record.phrase}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[12px] text-charcoal/80">
                        {typeof record.metrics?.audienceIndex === 'number'
                          ? `${record.metrics.audienceIndex.toFixed(2)}×`
                          : '—'}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[12px] text-charcoal/80">
                        {typeof record.metrics?.audiencePct === 'number'
                          ? `${Math.round(record.metrics.audiencePct * 100)}%`
                          : '—'}
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-charcoal/70">
                        {record.provenance.sourceReport}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 max-w-[80ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
              Seeded{' '}
              {new Date(data.sync.finishedAt as string).toLocaleString('en-AU')} · market{' '}
              {data.context.semrushDatabase} · index 1.00 = national average ·{' '}
              <span className="text-red-text">
                authored synthetic fixture — gwi is not connected; no live
                evidence was fetched
              </span>
            </p>
          </section>
        </>
      )}
    </div>
  )
}
