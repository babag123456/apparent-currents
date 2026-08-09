import type { Metadata } from 'next'
import React from 'react'

import { FixtureStamp } from '../../../../features/currents/components/deep-dive/FixtureStamp.tsx'
import { MarkerList } from '../../../../features/currents/components/deep-dive/MarkerList.tsx'
import { MiniTrend, TrendAlt } from '../../../../features/currents/components/deep-dive/MiniTrend.tsx'
import { Notice } from '../../../../features/currents/components/deep-dive/Notice.tsx'
import { SectionHead } from '../../../../features/currents/components/deep-dive/SectionHead.tsx'
import { SourceChip } from '../../../../features/currents/components/SourceChip.tsx'
import { PR_PUBLICATIONS_FIXTURE } from '../../../../features/currents/fixtures/prPublications.ts'
import { getLensFixture } from '../../../../features/currents/queries/getLensFixture.ts'

export const metadata: Metadata = { title: 'Currents · Deep Dive · Conversation' }
export const dynamic = 'force-dynamic'

/**
 * Conversation lens — what people are talking about. Brandwatch is not
 * connected and no adapter exists yet; everything shown here is authored
 * synthetic fixture data, stamped as such at every level.
 */

function sentimentLabel(value: number | null | undefined): string {
  if (typeof value !== 'number') return '—'
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`
}

export default async function ConversationPage() {
  const data = await getLensFixture('conversation')

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-charcoal">
          Conversation
        </h1>
        <SourceChip source="brandwatch" connected={false} />
      </div>
      <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/70">
        What this audience is talking about: mention volumes by theme, how they
        move over time, and whether the sentiment behind them is warming or
        souring.
      </p>

      {!data?.sync ? (
        <Notice tone="info" title="Brandwatch isn’t connected">
          <p>
            Conversation evidence will come from the Brandwatch API; no adapter
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

          <section aria-labelledby="conversation-markers" className="mt-12">
            <SectionHead
              id="conversation-markers"
              title="Markers"
              note={`${data.markers.length} authored · synthetic fixture`}
            />
            <MarkerList markers={data.markers} source="brandwatch" sourceConnected={false} />
          </section>

          <section aria-labelledby="conversation-evidence" className="mt-12 pb-4">
            <SectionHead
              id="conversation-evidence"
              title="Evidence"
              note={`${data.evidence.length} themes · synthetic fixture`}
            />
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-labelledby="conversation-evidence"
            >
              <table className="mt-1 w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-charcoal/10 font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                    <th scope="col" className="py-2.5 pr-4 font-medium">Theme</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">Mentions/mo</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">12-mo trend</th>
                    <th scope="col" className="py-2.5 pr-4 font-medium">Net sentiment</th>
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
                        {record.metrics?.mentions?.toLocaleString('en-AU') ?? '—'}
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
                        {sentimentLabel(record.metrics?.netSentiment)}
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
                authored synthetic fixture — brandwatch is not connected; no live
                evidence was fetched
              </span>
            </p>
          </section>
        </>
      )}

      {/* PR & publications: authored fixture module, independent of the
          seeded sync. Live path = Brandwatch media monitoring → evidence
          records; this module retires when that adapter exists. */}
      {data && PR_PUBLICATIONS_FIXTURE.brand === data.context.brand ? (
        <section aria-labelledby="conversation-pr" className="mt-12 pb-4">
          <SectionHead
            id="conversation-pr"
            title="PR & publications"
            note={`${PR_PUBLICATIONS_FIXTURE.publications.length} publications · synthetic fixture`}
          />
          <p className="mt-3 max-w-[68ch] text-[14px] leading-relaxed text-charcoal/70">
            Which publications this audience reads, how much of the category
            conversation each carries, and where the brand and its competitors
            actually appear in it.
          </p>
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-labelledby="conversation-pr"
          >
            <table className="mt-4 w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-charcoal/10 font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                  <th scope="col" className="py-2.5 pr-4 font-medium">Publication</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">Category items/mo</th>
                  <th scope="col" className="py-2.5 pr-4 font-medium">Where brands appear</th>
                  <th scope="col" className="py-2.5 font-medium">Reading</th>
                </tr>
              </thead>
              <tbody>
                {PR_PUBLICATIONS_FIXTURE.publications.map((publication) => (
                  <tr key={publication.name} className="border-b border-charcoal/10 align-top">
                    <td className="py-3 pr-4">
                      <span className="block text-[14px] font-medium text-charcoal">
                        {publication.name}
                      </span>
                      <span className="mt-0.5 block max-w-[26ch] text-[12px] leading-snug text-charcoal/70">
                        {publication.readFor}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[12px] text-charcoal/80">
                      {publication.categoryItems}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px] leading-relaxed text-charcoal/80">
                      {publication.brandItems.map((entry, index) => (
                        <span key={entry.brand} className="whitespace-nowrap">
                          {index > 0 ? ' · ' : ''}
                          <span
                            className={
                              entry.brand === PR_PUBLICATIONS_FIXTURE.brand
                                ? 'text-red-text'
                                : undefined
                            }
                          >
                            {entry.brand} {entry.items}
                          </span>
                        </span>
                      ))}
                    </td>
                    <td className="py-3 max-w-[34ch] text-[13px] leading-relaxed text-charcoal/75">
                      {publication.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-[80ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
            Items = pieces mentioning the premium-EV category · brand counts are items
            naming each brand ·{' '}
            <span className="text-red-text">
              authored synthetic fixture — publication monitoring arrives with the
              brandwatch connector; no live media data was fetched
            </span>
          </p>
        </section>
      ) : null}
    </div>
  )
}
