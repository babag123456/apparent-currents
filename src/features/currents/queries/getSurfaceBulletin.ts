import { getPayload } from 'payload'

import config from '@payload-config'
import { deriveCurrents } from '../../../intelligence/currents/deriveCurrents.ts'
import type { StoredMarker } from '../../../intelligence/currents/types.ts'
import { syncFreshness } from '../../../intelligence/sync/status.ts'
import {
  DEMO_BULLETIN,
  type FixtureBulletin,
  type FixtureCurrent,
  type FixtureMarker,
} from '../fixtures/demoCurrents.ts'

/**
 * Build the Surface bulletin view. When stored demand markers exist (from
 * the latest successful sync), currents are machine-derived from them and
 * the bulletin is labelled derived — synthetic when the sync was seeded
 * fixture evidence, live otherwise. With no imported data the authored
 * fixture bulletin renders, labelled fixture. Opportunities remain
 * authored strategic interpretation: none are generated automatically, so
 * derived mode carries an honest empty state.
 */

export type BulletinMode = 'authored-fixture' | 'derived-synthetic' | 'derived-live'

export interface SurfaceBulletinView extends Omit<FixtureBulletin, 'opportunities'> {
  mode: BulletinMode
  opportunities: FixtureBulletin['opportunities']
  /** Set in derived modes. */
  provenance?: {
    retrievedAt: string
    market: string
    estimatedUnits: number
    freshness: 'fresh' | 'stale'
    markerCount: number
    evidenceCount: number
    unclusteredCount: number
  }
}

function pctLabel(value: number): string {
  return `${value >= 0 ? '+' : '−'}${Math.abs(Math.round(value * 100))}%`
}

function markerMetric(marker: StoredMarker): string {
  if (marker.kind === 'high-demand') {
    return `“${marker.phrase}” — ${Math.round(marker.magnitude)}× the median search volume of the set`
  }
  return `“${marker.phrase}” — ${pctLabel(marker.magnitude)} recent trend vs baseline`
}

const FLAT_TREND = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]

export async function getSurfaceBulletin(): Promise<SurfaceBulletinView> {
  const authoredFallback: SurfaceBulletinView = { ...DEMO_BULLETIN, mode: 'authored-fixture' }

  let payload
  try {
    payload = await getPayload({ config })
  } catch {
    // No database (e.g. static build without env) — the authored fixture
    // bulletin is the honest fallback and says so on its stamp.
    return authoredFallback
  }

  const context = (
    await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
  ).docs[0]
  if (!context) return authoredFallback

  const sync = (
    await payload.find({
      collection: 'data-syncs',
      where: {
        context: { equals: context.id },
        lens: { equals: 'demand' },
        source: { equals: 'semrush' },
        status: { equals: 'succeeded' },
      },
      sort: '-finishedAt',
      limit: 1,
    })
  ).docs[0]
  if (!sync || !sync.finishedAt) return authoredFallback

  const [markerDocs, evidenceDocs] = await Promise.all([
    payload.find({
      collection: 'markers',
      where: { sync: { equals: sync.id } },
      limit: 200,
    }),
    payload.find({
      collection: 'evidence-records',
      where: { sync: { equals: sync.id } },
      limit: 200,
    }),
  ])
  if (markerDocs.docs.length === 0) return authoredFallback

  // Currents derivation is demand-only for now: keep other lens marker
  // kinds out even if a sync ever mixes them.
  const DEMAND_KINDS = ['demand-rising', 'demand-declining', 'high-demand'] as const
  type DemandKind = (typeof DEMAND_KINDS)[number]
  const isDemandKind = (kind: string): kind is DemandKind =>
    (DEMAND_KINDS as readonly string[]).includes(kind)

  const storedMarkers: StoredMarker[] = markerDocs.docs
    .filter((doc) => isDemandKind(doc.kind))
    .map((doc) => ({
    id: doc.id,
    kind: doc.kind as DemandKind,
    direction: doc.direction,
    confidence: doc.confidence,
    statement: doc.statement,
    phrase: doc.phrase,
    topic: doc.topic ?? null,
    magnitude: doc.magnitude,
  }))

  const volumesByPhrase = new Map<string, number>()
  const trendsByPhrase = new Map<string, number[]>()
  for (const record of evidenceDocs.docs) {
    if (typeof record.metrics?.searchVolume === 'number') {
      volumesByPhrase.set(record.phrase, record.metrics.searchVolume)
    }
    if (Array.isArray(record.trend) && record.trend.length > 1) {
      trendsByPhrase.set(record.phrase, record.trend as number[])
    }
  }

  const { currents, unclustered } = deriveCurrents(storedMarkers, { volumesByPhrase })
  if (currents.length === 0) return authoredFallback

  const viewCurrents: FixtureCurrent[] = currents.map((current) => {
    // Volume-weighted aggregate of the cluster's evidence trends.
    const memberTrends = current.phrases
      .map((phrase) => ({
        trend: trendsByPhrase.get(phrase),
        weight: volumesByPhrase.get(phrase) ?? 1,
      }))
      .filter((entry): entry is { trend: number[]; weight: number } => Boolean(entry.trend))
    let trend = FLAT_TREND
    if (memberTrends.length) {
      const length = Math.min(...memberTrends.map((entry) => entry.trend.length))
      const totalWeight = memberTrends.reduce((sum, entry) => sum + entry.weight, 0)
      trend = Array.from({ length }, (_, index) =>
        memberTrends.reduce(
          (sum, entry) => sum + entry.trend[entry.trend.length - length + index] * entry.weight,
          0,
        ) / totalWeight,
      )
    }

    const markers: FixtureMarker[] = current.markers.map((marker) => ({
      statement: marker.statement,
      metric: markerMetric(marker),
      source: 'semrush',
      sourceReport: 'marker derivation v0',
      confidence: marker.confidence,
    }))

    return {
      id: current.id,
      title: current.title,
      status: current.status,
      summary: `Machine-clustered pattern: ${current.markers.length} markers across ${current.phrases.length} phrase${current.phrases.length === 1 ? '' : 's'} sharing the “${current.topic}” topic.`,
      magnitude: current.totalVolume
        ? `${(current.totalVolume / 1000).toLocaleString('en-AU', { maximumFractionDigits: 1 })}k searches/mo · ${current.phrases.length}-phrase cluster`
        : `${current.phrases.length}-phrase cluster`,
      momentum: `${current.momentumFigure} mean trend change`,
      momentumFigure: current.momentumFigure,
      direction: current.direction,
      confidence: current.confidence,
      trend,
      markers,
    }
  })

  const lead = currents[0]
  const isFixture = Boolean(sync.isFixture)

  return {
    mode: isFixture ? 'derived-synthetic' : 'derived-live',
    issued: new Date(sync.finishedAt).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    period: context.period ?? 'latest',
    lead: {
      statement: `${lead.title}, ${lead.momentumFigure} on mean trend.`,
      dek:
        `A machine-derived read of the latest demand import: ${currents.length} ` +
        `current${currents.length === 1 ? '' : 's'} clustered from ` +
        `${storedMarkers.length} markers across ${evidenceDocs.docs.length} phrases. ` +
        `Derived interpretation, not authored analysis — trace any finding through ` +
        `Deep Dive before saying it aloud.`,
      basedOn: currents.slice(0, 2).map((c) => c.id),
      confidence: lead.confidence,
    },
    currents: viewCurrents,
    opportunities: [],
    provenance: {
      retrievedAt: sync.finishedAt,
      market: context.semrushDatabase,
      estimatedUnits: sync.estimatedUnits ?? 0,
      freshness: syncFreshness(sync.finishedAt),
      markerCount: storedMarkers.length,
      evidenceCount: evidenceDocs.docs.length,
      unclusteredCount: unclustered.length,
    },
  }
}
