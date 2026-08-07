import { NOTHING_FOUND_CODE, parseErrorBody, parseSemicolonCsv } from './csv.ts'
import {
  SEMRUSH_UNIT_COST_PER_LINE,
  type SemrushReportResult,
  type SemrushReportType,
} from './types.ts'

/**
 * Server-side client for the Semrush Analytics API (v3).
 *
 * - The API key never leaves the server: this module throws if constructed
 *   in a browser context, and the key is never logged or echoed in errors.
 * - Paid API: callers receive an estimated unit cost with every result and
 *   should meter usage; keep display_limit tight.
 * - "ERROR 50 :: NOTHING FOUND" is returned as an empty result, not thrown.
 */

const BASE_URL = 'https://api.semrush.com/'

export class SemrushApiError extends Error {
  readonly code: number | null
  readonly httpStatus: number | null

  constructor(message: string, options: { code?: number | null; httpStatus?: number | null } = {}) {
    super(message)
    this.name = 'SemrushApiError'
    this.code = options.code ?? null
    this.httpStatus = options.httpStatus ?? null
  }
}

export class SemrushConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SemrushConfigError'
  }
}

export interface SemrushClientOptions {
  apiKey?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export class SemrushClient {
  private readonly apiKey: string
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number

  constructor(options: SemrushClientOptions = {}) {
    if (typeof window !== 'undefined') {
      throw new SemrushConfigError('SemrushClient must only be used server-side.')
    }
    const apiKey = options.apiKey ?? process.env.SEMRUSH_API_KEY
    if (!apiKey) {
      throw new SemrushConfigError(
        'Missing SEMRUSH_API_KEY. Set it in .env (server-side only, never committed).',
      )
    }
    this.apiKey = apiKey
    this.fetchImpl = options.fetchImpl ?? fetch
    this.timeoutMs = options.timeoutMs ?? 30_000
  }

  /**
   * Fetch one report. `params` are the report-specific query parameters
   * (type/key are added here; values are URL-encoded).
   */
  async fetchReport(
    reportType: SemrushReportType,
    params: Record<string, string>,
    database: string,
  ): Promise<SemrushReportResult> {
    const url = new URL(BASE_URL)
    url.searchParams.set('type', reportType)
    url.searchParams.set('key', this.apiKey)
    url.searchParams.set('database', database)
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value)
    }

    let response: Response
    try {
      response = await this.fetchImpl(url.toString(), {
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch (error) {
      throw new SemrushApiError(
        `Semrush request failed: ${error instanceof Error ? error.message : 'network error'}`,
      )
    }

    const body = await response.text()

    if (!response.ok) {
      // Semrush also delivers "ERROR <code> :: <message>" bodies over non-200
      // statuses (e.g. HTTP 403 + ERROR 132 when the unit balance is zero).
      const httpErrorBody = parseErrorBody(body)
      if (httpErrorBody) {
        throw new SemrushApiError(
          `Semrush error ${httpErrorBody.code}: ${httpErrorBody.message}`,
          { code: httpErrorBody.code, httpStatus: response.status },
        )
      }
      const snippet = body.slice(0, 200).replace(/\s+/g, ' ').trim()
      throw new SemrushApiError(
        `Semrush responded with HTTP ${response.status}${snippet ? `: ${snippet}` : '.'}`,
        { httpStatus: response.status },
      )
    }

    const errorBody = parseErrorBody(body)
    const requestedAt = new Date().toISOString()

    if (errorBody) {
      if (errorBody.code === NOTHING_FOUND_CODE) {
        return { reportType, rows: [], estimatedUnits: 0, requestedAt, database }
      }
      throw new SemrushApiError(`Semrush error ${errorBody.code}: ${errorBody.message}`, {
        code: errorBody.code,
      })
    }

    const rows = parseSemicolonCsv(body)
    return {
      reportType,
      rows,
      estimatedUnits: rows.length * SEMRUSH_UNIT_COST_PER_LINE[reportType],
      requestedAt,
      database,
    }
  }
}
