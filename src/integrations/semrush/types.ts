/**
 * Vendor-side types for the Semrush Analytics API (v3).
 * These shapes must not leak past the normalizers — the rest of the app
 * consumes the canonical evidence model in src/intelligence/evidence.
 */

/** Report types this integration currently implements. */
export type SemrushReportType = 'phrase_these' | 'phrase_related' | 'domain_organic'

/**
 * API unit cost per response line, per report, as documented at
 * developer.semrush.com (verified 2026-08-07). Historical requests
 * (display_date) cost more; we do not request historical data yet.
 */
export const SEMRUSH_UNIT_COST_PER_LINE: Record<SemrushReportType, number> = {
  phrase_these: 10,
  phrase_related: 40,
  domain_organic: 10,
}

/** Common request options for keyword reports. */
export interface SemrushRequestBase {
  /** Regional database, e.g. "au", "us", "uk". */
  database: string
  displayLimit?: number
  displaySort?: string
  displayFilter?: string
}

export interface PhraseTheseRequest extends SemrushRequestBase {
  /** Up to 100 phrases per request. */
  phrases: string[]
}

export interface PhraseRelatedRequest extends SemrushRequestBase {
  phrase: string
}

export interface DomainOrganicRequest extends SemrushRequestBase {
  domain: string
}

/**
 * Raw parsed rows, keyed by the human-readable CSV header Semrush returns
 * for each export column. Optional because responses only include the
 * columns requested via export_columns.
 */
export interface RawKeywordRow {
  /** Ph */ Keyword?: string
  /** Nq */ 'Search Volume'?: string
  /** Cp */ CPC?: string
  /** Co */ Competition?: string
  /** Nr */ 'Number of Results'?: string
  /** Td */ Trends?: string
  /** In */ Intent?: string
  /** Po */ Position?: string
  /** Pp */ 'Previous Position'?: string
}

/** A completed report call, with the metering data callers need to log. */
export interface SemrushReportResult {
  reportType: SemrushReportType
  rows: Record<string, string>[]
  /** Lines returned × documented per-line cost. An estimate, not a bill. */
  estimatedUnits: number
  requestedAt: string
  database: string
}
