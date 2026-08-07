import type { DemandEvidence, Provenance, SearchIntent, TrendSeries } from '../../intelligence/evidence/types.ts'
import type { SemrushReportResult } from './types.ts'

/**
 * Normalizers: Semrush CSV rows → canonical demand evidence.
 * All vendor quirks (column names, intent codes, trend encoding) end here.
 */

/**
 * Semrush intent codes as documented for the In export column:
 * 0 commercial, 1 informational, 2 navigational, 3 transactional.
 * TODO(probe): confirm code order against a live response before relying
 * on intent in product UI.
 */
const INTENT_BY_CODE: Record<string, SearchIntent> = {
  '0': 'commercial',
  '1': 'informational',
  '2': 'navigational',
  '3': 'transactional',
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * Trends arrive as a comma-separated series of 12 relative values (0..1),
 * oldest month first. Malformed entries invalidate the whole series rather
 * than producing a silently misleading trend.
 */
export function parseTrendSeries(value: string | undefined): TrendSeries | undefined {
  if (!value || value.trim() === '') return undefined
  const points = value.split(',').map((point) => Number(point.trim()))
  if (points.length === 0 || points.some((point) => !Number.isFinite(point))) return undefined
  return points
}

export function parseIntents(value: string | undefined): SearchIntent[] | undefined {
  if (!value || value.trim() === '') return undefined
  const intents = value
    .split(',')
    .map((code) => INTENT_BY_CODE[code.trim()])
    .filter((intent): intent is SearchIntent => intent !== undefined)
  return intents.length ? intents : undefined
}

function buildProvenance(result: SemrushReportResult): Provenance {
  return {
    source: 'semrush',
    sourceReport: result.reportType,
    retrievedAt: result.requestedAt,
    market: result.database,
    period: 'latest',
  }
}

/** Shared row → evidence conversion for keyword-shaped reports. */
function normalizeKeywordRow(
  row: Record<string, string>,
  provenance: Provenance,
  topic?: string,
): DemandEvidence | null {
  const phrase = row['Keyword']?.trim()
  if (!phrase) return null
  return {
    lens: 'demand',
    provenance,
    phrase,
    topic,
    metrics: {
      searchVolume: parseNumber(row['Search Volume']),
      cpc: parseNumber(row['CPC']),
      competition: parseNumber(row['Competition']),
      resultsCount: parseNumber(row['Number of Results']),
      trend: parseTrendSeries(row['Trends']),
    },
    intents: parseIntents(row['Intent']),
  }
}

/** phrase_these / phrase_related → demand evidence. */
export function normalizeKeywordReport(
  result: SemrushReportResult,
  options: { topic?: string } = {},
): DemandEvidence[] {
  const provenance = buildProvenance(result)
  return result.rows
    .map((row) => normalizeKeywordRow(row, provenance, options.topic))
    .filter((record): record is DemandEvidence => record !== null)
}

/** domain_organic → demand evidence with the domain and positions attached. */
export function normalizeDomainOrganicReport(
  result: SemrushReportResult,
  options: { domain: string; topic?: string },
): DemandEvidence[] {
  const provenance = buildProvenance(result)
  return result.rows
    .map((row) => {
      const record = normalizeKeywordRow(row, provenance, options.topic)
      if (!record) return null
      record.domain = options.domain
      record.metrics.position = parseNumber(row['Position'])
      record.metrics.previousPosition = parseNumber(row['Previous Position'])
      return record
    })
    .filter((record): record is DemandEvidence => record !== null)
}
