import type { DemandEvidence, Evidence } from '../evidence/types.ts'
import type { MarkerRecordInput } from '../markers/types.ts'
import { SemrushApiError } from '../../integrations/semrush/client.ts'

/**
 * Pure mappings between the canonical intelligence model and Payload
 * collection data, plus error → sync-status mapping. Kept free of Payload
 * imports so they stay trivially testable.
 */

export type SyncFailureStatus = 'failed' | 'quota-exceeded'

/** Semrush error code for an exhausted API unit balance. */
export const QUOTA_EXHAUSTED_CODE = 132

export function syncStatusForError(error: unknown): SyncFailureStatus {
  if (error instanceof SemrushApiError && error.code === QUOTA_EXHAUSTED_CODE) {
    return 'quota-exceeded'
  }
  return 'failed'
}

/** Sanitised, length-capped failure detail for the sync record. */
export function sanitizedErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error'
  return message.slice(0, 300)
}

export function evidenceToRecordData(
  evidence: Evidence,
  contextId: number,
  syncId: number,
): Record<string, unknown> {
  const base = {
    lens: evidence.lens,
    source: evidence.provenance.source,
    phrase: evidence.phrase,
    topic: evidence.topic ?? null,
    provenance: {
      sourceReport: evidence.provenance.sourceReport,
      retrievedAt: evidence.provenance.retrievedAt,
      market: evidence.provenance.market,
      period: evidence.provenance.period,
    },
    context: contextId,
    sync: syncId,
  }

  switch (evidence.lens) {
    case 'demand':
      return {
        ...base,
        kind: evidence.domain ? 'domain-keyword' : 'keyword',
        domain: evidence.domain ?? null,
        metrics: {
          searchVolume: evidence.metrics.searchVolume ?? null,
          cpc: evidence.metrics.cpc ?? null,
          competition: evidence.metrics.competition ?? null,
          resultsCount: evidence.metrics.resultsCount ?? null,
          position: evidence.metrics.position ?? null,
          previousPosition: evidence.metrics.previousPosition ?? null,
        },
        trend: evidence.metrics.trend ?? null,
        intents: evidence.intents ?? null,
      }
    case 'conversation':
      return {
        ...base,
        kind: 'mention-volume',
        metrics: {
          mentions: evidence.metrics.mentions ?? null,
          netSentiment: evidence.metrics.netSentiment ?? null,
        },
        trend: evidence.metrics.trend ?? null,
      }
    case 'behaviour':
      return {
        ...base,
        kind: 'page-engagement',
        metrics: {
          sessions: evidence.metrics.sessions ?? null,
          engagementRate: evidence.metrics.engagementRate ?? null,
        },
        trend: evidence.metrics.trend ?? null,
      }
    case 'people':
      return {
        ...base,
        kind: 'audience-attribute',
        metrics: {
          audienceIndex: evidence.metrics.audienceIndex ?? null,
          audiencePct: evidence.metrics.audiencePct ?? null,
        },
        trend: null,
      }
  }
}

export function markerToRecordData(
  marker: MarkerRecordInput,
  contextId: number,
  syncId: number,
  evidenceIdsByPhrase: Map<string, number>,
): Record<string, unknown> {
  return {
    kind: marker.kind,
    direction: marker.direction,
    confidence: marker.confidence,
    statement: marker.statement,
    phrase: marker.phrase,
    topic: marker.topic ?? null,
    market: marker.market,
    magnitude: marker.magnitude,
    sources: marker.sources,
    derivedAt: marker.derivedAt,
    context: contextId,
    sync: syncId,
    evidence: marker.evidence
      .map((item) => evidenceIdsByPhrase.get(item.phrase))
      .filter((id): id is number => typeof id === 'number'),
  }
}

/**
 * De-duplicate evidence by phrase (first occurrence wins — the overview
 * fetch is listed before related, so direct topic evidence takes
 * precedence over the same phrase resurfacing as a related keyword).
 */
export function dedupeByPhrase(evidence: DemandEvidence[]): DemandEvidence[] {
  const seen = new Set<string>()
  const result: DemandEvidence[] = []
  for (const item of evidence) {
    const key = `${item.phrase}::${item.domain ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}
