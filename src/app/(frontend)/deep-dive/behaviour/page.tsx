import type { Metadata } from 'next'
import React from 'react'

import { FixtureStamp } from '../../../../features/currents/components/deep-dive/FixtureStamp.tsx'
import { MarkerList } from '../../../../features/currents/components/deep-dive/MarkerList.tsx'
import { MiniTrend, TrendAlt } from '../../../../features/currents/components/deep-dive/MiniTrend.tsx'
import { Notice } from '../../../../features/currents/components/deep-dive/Notice.tsx'
import { SectionHead } from '../../../../features/currents/components/deep-dive/SectionHead.tsx'
import { SourceChip } from '../../../../features/currents/components/SourceChip.tsx'
import { getLensFixture } from '../../../../features/currents/queries/getLensFixture.ts'

export const metadata: Metadata = { title: 'Behaviour · Deep Dive · CURRENTS' }
export const dynamic = 'force-dynamic'

/**
 * Behaviour lens — what people do on owned properties. GA4 is not
 * connected and no adapter exists yet; everything shown here is authored
 * synthetic fixture data, stamped as such at every level.
 */
export default async function BehaviourPage() {
  const data = await getLensFixture('behaviour')

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-charcoal">
          Behaviour
        </h1>
        <SourceChip source="ga4" connected={false} />
      </div>
      <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/70">
        What this audience does on owned properties: which pages they reach,
        how those sessions move over time, and where they actually engage
        rather than bounce.
      </p>

      {!data?.sync ? (
        <Notice tone="info" title="GA4 isn’t connected">
          <p>
            Behaviour evidence will come from the GA4 Data API; no adapter
            exists yet. To explore this lens with authored synthetic data, seed
            the fixture locally with{' '}
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

          <section aria-labelledby="behaviour-markers" className="mt-12">
            <SectionHead
              id="behaviour-markers"
              title="Markers"
              note={`${data.markers.length} authored · synthetic fixture`}
            />
            <MarkerList markers={data.markers} source="ga4" sourceConnected={false} />
          </section>

          <section aria-labelledby="behaviour-evidence" className="mt-12 pb-4">
            <SectionHead
              id="behaviour-evidence"
              title="Evidence"
              note={`${data.evidence.length} pages · synthetic fixture`}
            />
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-labelledby="behaviour-evidence"
            >
              <table className="mt-1 w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-charcoal/10 font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                    <th scope="col" className="py-2.5 pr-4 font-medium">Page</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">Sessions/mo</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">12-mo trend</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">Engagement</th>
                    <th scope="col" className="py-2.5 font-medium">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evidence.map((record) => (
                    <tr key={record.id} className="border-b border-charcoal/10">
                      <td className="py-2.5 pr-4 font-mono text-[12px] font-medium text-charcoal">
                        {record.phrase}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[12px] text-charcoal/80">
                        {record.metrics?.sessions?.toLocaleString('en-AU') ?? '—'}
                      </td>
                      <td className="py-2.5 pr-4">
                        {Array.isArray(record.trend) && record.trend.length > 1 ? (
                          <>
                            <MiniTrend trend={record.trend as number[]} />
                            <TrendAlt trend={record.trend as number[]} />
                          </>
                        ) : (
                          <span className="font-mono text-[11px] text-charcoal/70">
                            —<span className="sr-only"> no trend data</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[12px] text-charcoal/80">
                        {typeof record.metrics?.engagementRate === 'number'
                          ? `${Math.round(record.metrics.engagementRate * 100)}%`
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
              {data.context.semrushDatabase} ·{' '}
              <span className="text-red-text">
                authored synthetic fixture — ga4 is not connected; no live
                evidence was fetched
              </span>
            </p>
          </section>
        </>
      )}
    </div>
  )
}
