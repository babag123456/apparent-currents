import { describe, expect, it } from 'vitest'

import type { DemandEvidence } from '../evidence/types.ts'
import { deriveDemandMarkers, trendChange } from './deriveDemandMarkers.ts'

function demand(
  phrase: string,
  metrics: DemandEvidence['metrics'],
  market = 'au',
): DemandEvidence {
  return {
    lens: 'demand',
    phrase,
    provenance: {
      source: 'semrush',
      sourceReport: 'phrase_these',
      retrievedAt: '2026-08-07T00:00:00.000Z',
      market,
      period: 'latest',
    },
    metrics,
  }
}

const RISING = [0.4, 0.4, 0.4, 0.4, 0.45, 0.45, 0.45, 0.5, 0.5, 0.9, 1.0, 1.0]
const DECLINING = [1.0, 1.0, 0.9, 0.9, 0.85, 0.8, 0.8, 0.75, 0.7, 0.4, 0.35, 0.3]
const FLAT = [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8]

describe('trendChange', () => {
  it('returns null for missing or short series', () => {
    expect(trendChange(undefined)).toBeNull()
    expect(trendChange([0.5, 0.6, 0.7])).toBeNull()
  })

  it('returns null when the baseline is ~zero (avoids infinite-growth reads)', () => {
    expect(trendChange([0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0.8, 1])).toBeNull()
  })

  it('computes signed relative change for a rising series', () => {
    const change = trendChange(RISING)
    expect(change).not.toBeNull()
    expect(change!).toBeGreaterThan(0.25)
  })
})

describe('deriveDemandMarkers', () => {
  it('emits demand-rising with an evidence trail', () => {
    const evidence = demand('home charging', { searchVolume: 5400, trend: RISING })
    const markers = deriveDemandMarkers([evidence])

    const rising = markers.find((m) => m.kind === 'demand-rising')
    expect(rising).toBeDefined()
    expect(rising!.direction).toBe('up')
    expect(rising!.magnitude).toBeGreaterThan(0.25)
    expect(rising!.confidence).toBe('strong')
    expect(rising!.evidence).toEqual([evidence])
    expect(rising!.statement).toContain('home charging')
  })

  it('emits demand-declining for a falling series', () => {
    const markers = deriveDemandMarkers([
      demand('diesel wagon', { searchVolume: 3600, trend: DECLINING }),
    ])
    const declining = markers.find((m) => m.kind === 'demand-declining')
    expect(declining).toBeDefined()
    expect(declining!.direction).toBe('down')
    expect(declining!.magnitude).toBeLessThan(0)
  })

  it('emits nothing for a flat series', () => {
    expect(deriveDemandMarkers([demand('suv', { searchVolume: 9900, trend: FLAT })])).toEqual([])
  })

  it('labels thin-volume trends weak', () => {
    const markers = deriveDemandMarkers([demand('niche query', { searchVolume: 40, trend: RISING })])
    expect(markers[0]?.confidence).toBe('weak')
  })

  it('emits high-demand only against a sufficiently large set', () => {
    const set = [
      demand('ev charging', { searchVolume: 60000 }),
      demand('a', { searchVolume: 1000 }),
      demand('b', { searchVolume: 1100 }),
      demand('c', { searchVolume: 900 }),
      demand('d', { searchVolume: 1050 }),
    ]
    const markers = deriveDemandMarkers(set)
    const high = markers.filter((m) => m.kind === 'high-demand')
    expect(high).toHaveLength(1)
    expect(high[0].phrase).toBe('ev charging')
    expect(high[0].magnitude).toBeGreaterThan(5)
  })

  it('does not emit high-demand for small sets', () => {
    const markers = deriveDemandMarkers([
      demand('ev charging', { searchVolume: 60000 }),
      demand('a', { searchVolume: 100 }),
    ])
    expect(markers.filter((m) => m.kind === 'high-demand')).toEqual([])
  })

  it('handles records with no metrics at all', () => {
    expect(deriveDemandMarkers([demand('bare', {})])).toEqual([])
  })
})
