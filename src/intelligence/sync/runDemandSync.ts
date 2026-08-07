import type { Payload } from 'payload'

import { SemrushClient } from '../../integrations/semrush/client.ts'
import {
  fetchKeywordOverview,
  fetchRelatedKeywords,
} from '../../integrations/semrush/queries/index.ts'
import type { SemrushReportResult } from '../../integrations/semrush/types.ts'
import type { DemandEvidence } from '../evidence/types.ts'
import { deriveDemandMarkers } from '../markers/deriveDemandMarkers.ts'
import {
  dedupeByPhrase,
  evidenceToRecordData,
  markerToRecordData,
  sanitizedErrorMessage,
  syncStatusForError,
} from './mapping.ts'

/**
 * One metered demand import for an analysis context:
 *   1. keyword overview for the context's topic phrases (10 units/line)
 *   2. related keywords for the primary topic (40 units/line, tight limit)
 * Evidence and derived markers are persisted with full provenance, and the
 * data-syncs record tracks status, unit spend and failure detail. Errors
 * end the run with an honest status ('quota-exceeded' for an exhausted
 * unit balance) — they are recorded, not thrown.
 *
 * Runs through the Local API with overrideAccess (the collections deny
 * human writes). Invoked by the 'demand-sync' Payload job task.
 */

export const RELATED_KEYWORDS_LIMIT = 10

export interface DemandSyncResult {
  syncId: number
  status: 'succeeded' | 'failed' | 'quota-exceeded'
  estimatedUnits: number
  requestCount: number
  evidenceCount: number
  markerCount: number
  errorMessage?: string
}

export interface RunDemandSyncOptions {
  payload: Payload
  contextId: number
  /** Injectable for tests; defaults to a real client (server-side only). */
  client?: SemrushClient
  now?: () => Date
}

export async function runDemandSync(options: RunDemandSyncOptions): Promise<DemandSyncResult> {
  const { payload, contextId } = options
  const now = options.now ?? (() => new Date())

  const context = await payload.findByID({ collection: 'contexts', id: contextId })
  const topics = (context.topics ?? [])
    .map((topic) => topic.phrase.trim())
    .filter((phrase) => phrase.length > 0)

  if (topics.length === 0) {
    throw new Error(`Context ${contextId} has no topic phrases — nothing to import.`)
  }

  const sync = await payload.create({
    collection: 'data-syncs',
    data: {
      context: contextId,
      lens: 'demand',
      source: 'semrush',
      status: 'running',
      trigger: 'manual',
      startedAt: now().toISOString(),
    },
  })
  const syncId = sync.id

  const reports: SemrushReportResult[] = []

  try {
    const client = options.client ?? new SemrushClient()
    const database = context.semrushDatabase

    const overview = await fetchKeywordOverview(client, {
      phrases: topics,
      database,
      topic: topics[0],
    })
    reports.push(overview.report)

    const related = await fetchRelatedKeywords(client, {
      phrase: topics[0],
      database,
      displayLimit: RELATED_KEYWORDS_LIMIT,
      topic: topics[0],
    })
    reports.push(related.report)

    const evidence: DemandEvidence[] = dedupeByPhrase([
      ...overview.evidence,
      ...related.evidence,
    ])

    const evidenceIdsByPhrase = new Map<string, number>()
    for (const item of evidence) {
      const record = await payload.create({
        collection: 'evidence-records',
        data: evidenceToRecordData(item, contextId, syncId) as never,
        overrideAccess: true,
      })
      evidenceIdsByPhrase.set(item.phrase, record.id)
    }

    const markers = deriveDemandMarkers(evidence)
    for (const marker of markers) {
      await payload.create({
        collection: 'markers',
        data: markerToRecordData(marker, contextId, syncId, evidenceIdsByPhrase) as never,
        overrideAccess: true,
      })
    }

    const estimatedUnits = reports.reduce((sum, report) => sum + report.estimatedUnits, 0)
    await payload.update({
      collection: 'data-syncs',
      id: syncId,
      data: {
        status: 'succeeded',
        finishedAt: now().toISOString(),
        requestCount: reports.length,
        estimatedUnits,
        evidenceCount: evidence.length,
        markerCount: markers.length,
        reports: reports.map((report) => report.reportType),
      },
      overrideAccess: true,
    })

    return {
      syncId,
      status: 'succeeded',
      estimatedUnits,
      requestCount: reports.length,
      evidenceCount: evidence.length,
      markerCount: markers.length,
    }
  } catch (error) {
    const status = syncStatusForError(error)
    const errorMessage = sanitizedErrorMessage(error)
    const estimatedUnits = reports.reduce((sum, report) => sum + report.estimatedUnits, 0)

    await payload.update({
      collection: 'data-syncs',
      id: syncId,
      data: {
        status,
        finishedAt: now().toISOString(),
        requestCount: reports.length,
        estimatedUnits,
        reports: reports.map((report) => report.reportType),
        errorMessage,
      },
      overrideAccess: true,
    })

    return {
      syncId,
      status,
      estimatedUnits,
      requestCount: reports.length,
      evidenceCount: 0,
      markerCount: 0,
      errorMessage,
    }
  }
}
