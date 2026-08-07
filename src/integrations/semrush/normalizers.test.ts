import { describe, expect, it } from 'vitest'

import {
  normalizeDomainOrganicReport,
  normalizeKeywordReport,
  parseIntents,
  parseTrendSeries,
} from './normalizers.ts'
import type { SemrushReportResult } from './types.ts'

function report(rows: Record<string, string>[], overrides: Partial<SemrushReportResult> = {}): SemrushReportResult {
  return {
    reportType: 'phrase_these',
    rows,
    estimatedUnits: rows.length * 10,
    requestedAt: '2026-08-07T00:00:00.000Z',
    database: 'au',
    ...overrides,
  }
}

describe('parseTrendSeries', () => {
  it('parses a 12-point series', () => {
    const series = parseTrendSeries('0.5,0.5,0.6,0.6,0.7,0.7,0.8,0.8,0.9,0.9,1.00,1.00')
    expect(series).toHaveLength(12)
    expect(series?.[0]).toBe(0.5)
    expect(series?.[11]).toBe(1)
  })

  it('rejects the whole series when any point is malformed', () => {
    expect(parseTrendSeries('0.5,broken,0.7')).toBeUndefined()
  })

  it('returns undefined for empty input', () => {
    expect(parseTrendSeries('')).toBeUndefined()
    expect(parseTrendSeries(undefined)).toBeUndefined()
  })
})

describe('parseIntents', () => {
  it('maps documented codes', () => {
    expect(parseIntents('0,3')).toEqual(['commercial', 'transactional'])
  })

  it('drops unknown codes and returns undefined when none map', () => {
    expect(parseIntents('9')).toBeUndefined()
  })
})

describe('normalizeKeywordReport', () => {
  it('converts rows to canonical demand evidence with provenance', () => {
    const evidence = normalizeKeywordReport(
      report([
        {
          Keyword: 'ev charging',
          'Search Volume': '12100',
          CPC: '1.53',
          Competition: '0.45',
          'Number of Results': '98000000',
          Trends: '0.6,0.6,0.7,0.7,0.7,0.8,0.8,0.8,0.9,0.9,1.00,1.00',
          Intent: '1',
        },
      ]),
      { topic: 'ev-ownership' },
    )

    expect(evidence).toHaveLength(1)
    const record = evidence[0]
    expect(record.lens).toBe('demand')
    expect(record.phrase).toBe('ev charging')
    expect(record.topic).toBe('ev-ownership')
    expect(record.metrics.searchVolume).toBe(12100)
    expect(record.metrics.cpc).toBe(1.53)
    expect(record.metrics.trend).toHaveLength(12)
    expect(record.intents).toEqual(['informational'])
    expect(record.provenance).toEqual({
      source: 'semrush',
      sourceReport: 'phrase_these',
      retrievedAt: '2026-08-07T00:00:00.000Z',
      market: 'au',
      period: 'latest',
    })
  })

  it('skips rows without a keyword and tolerates missing metrics', () => {
    const evidence = normalizeKeywordReport(
      report([{ Keyword: '', 'Search Volume': '10' }, { Keyword: 'solar battery' }]),
    )
    expect(evidence).toHaveLength(1)
    expect(evidence[0].phrase).toBe('solar battery')
    expect(evidence[0].metrics.searchVolume).toBeUndefined()
  })

  it('returns [] for an empty report', () => {
    expect(normalizeKeywordReport(report([]))).toEqual([])
  })
})

describe('normalizeDomainOrganicReport', () => {
  it('attaches domain and positions', () => {
    const evidence = normalizeDomainOrganicReport(
      report(
        [{ Keyword: 'audi ev', 'Search Volume': '880', Position: '3', 'Previous Position': '5' }],
        { reportType: 'domain_organic' },
      ),
      { domain: 'audi.com.au' },
    )

    expect(evidence[0].domain).toBe('audi.com.au')
    expect(evidence[0].metrics.position).toBe(3)
    expect(evidence[0].metrics.previousPosition).toBe(5)
    expect(evidence[0].provenance.sourceReport).toBe('domain_organic')
  })
})
