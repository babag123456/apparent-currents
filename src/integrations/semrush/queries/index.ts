import type { DemandEvidence } from '../../../intelligence/evidence/types.ts'
import type { SemrushClient } from '../client.ts'
import { normalizeDomainOrganicReport, normalizeKeywordReport } from '../normalizers.ts'
import type {
  DomainOrganicRequest,
  PhraseRelatedRequest,
  PhraseTheseRequest,
  SemrushReportResult,
} from '../types.ts'

/**
 * The narrow query surface the rest of the app is allowed to use.
 * Each query returns canonical evidence plus the raw report result so
 * callers can log unit spend and provenance.
 */

export interface DemandQueryOutcome {
  evidence: DemandEvidence[]
  report: SemrushReportResult
}

const KEYWORD_COLUMNS = 'Ph,Nq,Cp,Co,Nr,Td,In'
const DOMAIN_ORGANIC_COLUMNS = 'Ph,Po,Pp,Nq,Cp,Co,Nr,Td'

/** Batch keyword overview (10 units/line). Up to 100 phrases. */
export async function fetchKeywordOverview(
  client: SemrushClient,
  request: PhraseTheseRequest & { topic?: string },
): Promise<DemandQueryOutcome> {
  if (request.phrases.length === 0) {
    throw new Error('fetchKeywordOverview requires at least one phrase.')
  }
  if (request.phrases.length > 100) {
    throw new Error('phrase_these accepts at most 100 phrases per request.')
  }
  const report = await client.fetchReport(
    'phrase_these',
    {
      phrase: request.phrases.join(';'),
      export_columns: KEYWORD_COLUMNS,
      ...(request.displayLimit ? { display_limit: String(request.displayLimit) } : {}),
    },
    request.database,
  )
  return { evidence: normalizeKeywordReport(report, { topic: request.topic }), report }
}

/** Related keywords for a seed phrase (40 units/line — keep limits tight). */
export async function fetchRelatedKeywords(
  client: SemrushClient,
  request: PhraseRelatedRequest & { topic?: string },
): Promise<DemandQueryOutcome> {
  const report = await client.fetchReport(
    'phrase_related',
    {
      phrase: request.phrase,
      export_columns: KEYWORD_COLUMNS,
      display_limit: String(request.displayLimit ?? 25),
      ...(request.displaySort ? { display_sort: request.displaySort } : {}),
    },
    request.database,
  )
  return { evidence: normalizeKeywordReport(report, { topic: request.topic }), report }
}

/** Organic keywords a domain ranks for (10 units/line). */
export async function fetchDomainOrganicKeywords(
  client: SemrushClient,
  request: DomainOrganicRequest & { topic?: string },
): Promise<DemandQueryOutcome> {
  const report = await client.fetchReport(
    'domain_organic',
    {
      domain: request.domain,
      export_columns: DOMAIN_ORGANIC_COLUMNS,
      display_limit: String(request.displayLimit ?? 25),
      ...(request.displaySort ? { display_sort: request.displaySort } : {}),
    },
    request.database,
  )
  return {
    evidence: normalizeDomainOrganicReport(report, {
      domain: request.domain,
      topic: request.topic,
    }),
    report,
  }
}
