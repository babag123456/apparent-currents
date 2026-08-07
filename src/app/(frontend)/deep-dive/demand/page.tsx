import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { MiniTrend, TrendAlt } from '../../../../features/currents/components/deep-dive/MiniTrend.tsx'
import { Notice } from '../../../../features/currents/components/deep-dive/Notice.tsx'
import { SectionHead } from '../../../../features/currents/components/deep-dive/SectionHead.tsx'
import { ImportControls } from '../../../../features/currents/components/demand/ImportControls.tsx'
import { SourceChip } from '../../../../features/currents/components/SourceChip.tsx'
import { RELATED_KEYWORDS_LIMIT } from '../../../../intelligence/sync/runDemandSync.ts'
import { COOLDOWN_MINUTES, canStartSync, syncFreshness } from '../../../../intelligence/sync/status.ts'
import { importDemandEvidence } from './actions.ts'

export const metadata: Metadata = { title: 'Demand · Deep Dive · CURRENTS' }
export const dynamic = 'force-dynamic'

/**
 * Demand lens — live Semrush evidence for the active analysis context.
 * Every state is designed and honest: not connected, no context, never
 * imported, running, quota exhausted, failed, and fresh/stale evidence
 * with full provenance. Imports are explicit, metered and admin-gated.
 */

export default async function DemandPage() {
  const semrushConfigured = Boolean(process.env.SEMRUSH_API_KEY)

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })

  const contexts = await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
  const context = contexts.docs[0] ?? null

  const latestSync = context
    ? (
        await payload.find({
          collection: 'data-syncs',
          where: { context: { equals: context.id }, source: { equals: 'semrush' } },
          sort: '-startedAt',
          limit: 1,
        })
      ).docs[0] ?? null
    : null

  const latestSuccess = context
    ? (
        await payload.find({
          collection: 'data-syncs',
          where: {
            context: { equals: context.id },
            source: { equals: 'semrush' },
            status: { equals: 'succeeded' },
          },
          sort: '-finishedAt',
          limit: 1,
        })
      ).docs[0] ?? null
    : null

  const [evidence, markers] = latestSuccess
    ? await Promise.all([
        payload.find({
          collection: 'evidence-records',
          where: { sync: { equals: latestSuccess.id } },
          sort: '-metrics.searchVolume',
          limit: 60,
        }),
        payload.find({
          collection: 'markers',
          where: { sync: { equals: latestSuccess.id } },
          sort: '-magnitude',
          limit: 60,
        }),
      ])
    : [null, null]

  const topicCount = context?.topics?.length ?? 0
  const estimatedUnits = topicCount * 10 + RELATED_KEYWORDS_LIMIT * 40

  const startDecision = canStartSync(
    latestSync
      ? {
          status: latestSync.status,
          startedAt: latestSync.startedAt,
          finishedAt: latestSync.finishedAt ?? null,
        }
      : null,
  )
  const disabledReason = !user
    ? 'Sign in to the admin to run metered imports.'
    : !startDecision.allowed
      ? startDecision.reason === 'running'
        ? 'An import is currently running.'
        : `Cooldown between imports is ${COOLDOWN_MINUTES} min — refresh available soon.`
      : undefined

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-medium leading-tight tracking-[-0.02em] text-charcoal">
          Demand
        </h1>
        <SourceChip source="semrush" connected={semrushConfigured} />
      </div>
      <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/70">
        What this audience is actively looking for: search volumes, movement over
        time, related and emerging queries — imported explicitly, cached, and
        traceable to the request that fetched them.
      </p>

      {!semrushConfigured ? (
        <Notice tone="info" title="Semrush isn’t connected">
          <p>
            Demand evidence comes from the Semrush Analytics API, which needs a
            server-side key. Add{' '}
            <code className="font-mono text-[13px]">SEMRUSH_API_KEY</code> to{' '}
            <code className="font-mono text-[13px]">.env</code> and restart the app. The key
            stays on the server — never exposed, committed, or logged.
          </p>
        </Notice>
      ) : !context ? (
        <Notice tone="info" title="No analysis context yet">
          <p>
            Imports run against an analysis context (brand · market · audience · topic
            phrases). Create one in the admin under{' '}
            <code className="font-mono text-[13px]">Contexts</code>, or seed the demo
            context locally with{' '}
            <code className="font-mono text-[13px]">npx tsx scripts/seed-demo-context.ts</code>.
          </p>
        </Notice>
      ) : (
        <>
          {/* Context + import stamp */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-1.5 border-b border-red/25 py-3">
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              <div className="flex items-baseline gap-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                  Context
                </dt>
                <dd className="font-mono text-[11px] text-charcoal/80">{context.name}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                  Topics
                </dt>
                <dd className="font-mono text-[11px] text-charcoal/80">
                  {topicCount} seed phrase{topicCount === 1 ? '' : 's'}
                </dd>
              </div>
              {latestSuccess?.finishedAt ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                      Last import
                    </dt>
                    <dd className="font-mono text-[11px] text-charcoal/80">
                      {new Date(latestSuccess.finishedAt).toLocaleString('en-AU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      · {latestSuccess.estimatedUnits ?? 0} units
                    </dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                      Status
                    </dt>
                    <dd className="font-mono text-[11px] uppercase tracking-[0.1em] text-charcoal/80">
                      {syncFreshness(latestSuccess.finishedAt)}
                    </dd>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-2">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                    Last import
                  </dt>
                  <dd className="font-mono text-[11px] text-charcoal/80">never</dd>
                </div>
              )}
            </dl>
            {context.isDemo ? (
              <span className="ml-auto shrink-0 rounded-full border border-red/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-red-text">
                Demo context
              </span>
            ) : null}
          </div>

          {/* Failure states from the most recent run */}
          {latestSync?.status === 'quota-exceeded' ? (
            <Notice tone="error" title="Semrush API unit balance is exhausted">
              <p>
                The key is valid, but the account has no API units (Semrush error 132),
                so the last import spent nothing and fetched nothing. Units are
                purchased separately from the subscription: Semrush → Subscription
                info → API units. Once topped up, retry the import below.
              </p>
            </Notice>
          ) : latestSync?.status === 'failed' ? (
            <Notice tone="error" title="The last import failed">
              <p>
                {latestSync.errorMessage ?? 'No further detail was recorded.'}{' '}
                Evidence shown below (if any) is from the last successful import.
              </p>
            </Notice>
          ) : latestSync?.status === 'running' ? (
            <Notice tone="info" title="Import in progress">
              <p>A sync is currently running for this context. Reload to see the outcome.</p>
            </Notice>
          ) : null}

          {/* Import / refresh */}
          <div className="mt-8">
            <ImportControls
              contextId={context.id}
              estimatedUnits={estimatedUnits}
              disabledReason={disabledReason}
              hasImportedBefore={Boolean(latestSuccess)}
              action={importDemandEvidence}
            />
          </div>

          {/* Evidence + markers from the last successful sync */}
          {latestSuccess && markers && evidence ? (
            <>
              <section aria-labelledby="demand-markers" className="mt-12">
                <SectionHead
                  id="demand-markers"
                  title="Markers"
                  note={`${markers.totalDocs} derived · this import${latestSuccess.isFixture ? ' · synthetic fixture' : ''}`}
                />
                {markers.docs.length === 0 ? (
                  <p className="mt-4 max-w-[62ch] text-[14px] leading-relaxed text-charcoal/70">
                    No markers cleared the derivation thresholds for this import — the
                    evidence below is still browsable, and thresholds are documented in
                    the derivation module.
                  </p>
                ) : (
                  <ul className="divide-y divide-charcoal/10">
                    {markers.docs.map((marker) => (
                      <li key={marker.id} className="py-4">
                        <p className="max-w-[70ch] text-[15px] font-medium leading-snug text-charcoal">
                          {marker.statement}
                        </p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-charcoal/70">
                          <span>{marker.kind}</span>
                          <span>
                            · {marker.magnitude >= 0 ? '+' : ''}
                            {Math.round(marker.magnitude * 100) / 100}
                          </span>
                          <span>· {marker.confidence} confidence</span>
                          <span>· “{marker.phrase}”</span>
                          <SourceChip source="semrush" connected />
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="demand-evidence" className="mt-12 pb-4">
                <SectionHead
                  id="demand-evidence"
                  title="Evidence"
                  note={`${evidence.totalDocs} records · ${latestSuccess.reports ? (latestSuccess.reports as string[]).join(' + ') : 'semrush'}${latestSuccess.isFixture ? ' · synthetic fixture' : ''}`}
                />
                {/* Focusable region so keyboard users can scroll the wide table. */}
                <div
                  className="overflow-x-auto"
                  tabIndex={0}
                  role="region"
                  aria-labelledby="demand-evidence"
                >
                  <table className="mt-1 w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-charcoal/10 font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
                        <th scope="col" className="py-2.5 pr-4 font-medium">Phrase</th>
                        <th scope="col" className="py-2.5 pr-4 font-medium">Volume/mo</th>
                        <th scope="col" className="py-2.5 pr-4 font-medium">12-mo trend</th>
                        <th scope="col" className="py-2.5 pr-4 font-medium">Intents</th>
                        <th scope="col" className="py-2.5 font-medium">Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidence.docs.map((record) => (
                        <tr key={record.id} className="border-b border-charcoal/10">
                          <td className="py-2.5 pr-4 text-[14px] font-medium text-charcoal">
                            {record.phrase}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-[12px] text-charcoal/80">
                            {record.metrics?.searchVolume?.toLocaleString('en-AU') ?? '—'}
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
                          <td className="py-2.5 pr-4 font-mono text-[11px] uppercase tracking-[0.06em] text-charcoal/70">
                            {Array.isArray(record.intents) && record.intents.length
                              ? (record.intents as string[]).join(' · ')
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
                  Retrieved{' '}
                  {latestSuccess.finishedAt
                    ? new Date(latestSuccess.finishedAt).toLocaleString('en-AU')
                    : '—'}{' '}
                  · market {context.semrushDatabase} · {latestSuccess.estimatedUnits ?? 0} API
                  units ·{' '}
                  {latestSuccess.isFixture ? (
                    <span className="text-red-text">
                      authored synthetic fixture — no live evidence was fetched
                    </span>
                  ) : (
                    'live evidence, machine-written and never hand-edited'
                  )}
                </p>
              </section>
            </>
          ) : semrushConfigured && context && !latestSync ? (
            <Notice tone="info" title="No demand evidence imported yet">
              <p>
                The first import fetches a keyword overview for the context’s{' '}
                {topicCount} topic phrase{topicCount === 1 ? '' : 's'} and up to{' '}
                {RELATED_KEYWORDS_LIMIT} related keywords for the primary topic —
                cached, timestamped, and metered. Nothing is fetched without the
                button above.
              </p>
            </Notice>
          ) : null}
        </>
      )}
    </div>
  )
}
