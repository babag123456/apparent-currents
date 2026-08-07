import { describe, expect, it } from 'vitest'

import {
  computeShareOfSearch,
  ctrForPosition,
  CTR_BEYOND_TEN,
  ORGANIC_CTR_BY_POSITION,
  VISIBILITY_FLOOR_POSITION,
} from './shareOfSearch.ts'

describe('ctrForPosition', () => {
  it('uses the disclosed curve for positions 1–10', () => {
    expect(ctrForPosition(1)).toBe(ORGANIC_CTR_BY_POSITION[0])
    expect(ctrForPosition(10)).toBe(ORGANIC_CTR_BY_POSITION[9])
  })

  it('uses the flat estimate between 11 and the visibility floor', () => {
    expect(ctrForPosition(11)).toBe(CTR_BEYOND_TEN)
    expect(ctrForPosition(VISIBILITY_FLOOR_POSITION)).toBe(CTR_BEYOND_TEN)
  })

  it('returns zero outside the visible range', () => {
    expect(ctrForPosition(0)).toBe(0)
    expect(ctrForPosition(VISIBILITY_FLOOR_POSITION + 1)).toBe(0)
  })
})

describe('computeShareOfSearch', () => {
  const rows = [
    { domain: 'a.com', phrase: 'ev suv', searchVolume: 1000, position: 1 },
    { domain: 'a.com', phrase: 'ev range', searchVolume: 500, position: 11 },
    { domain: 'b.com', phrase: 'ev suv', searchVolume: 1000, position: 2 },
    // Below the visibility floor: contributes nothing.
    { domain: 'b.com', phrase: 'ev range', searchVolume: 500, position: 40 },
  ]

  it('computes both shares as plain fractions of visible components', () => {
    const result = computeShareOfSearch(rows, ['a.com', 'b.com'])
    const [first, second] = result.shares

    expect(first.domain).toBe('a.com')
    expect(first.keywordsRanked).toBe(2)
    expect(first.visibleVolume).toBe(1500)
    expect(first.estimatedClicks).toBeCloseTo(1000 * 0.32 + 500 * 0.01)
    expect(first.shareOfVoice).toBeCloseTo(1500 / 2500)

    expect(second.domain).toBe('b.com')
    expect(second.keywordsRanked).toBe(1)
    expect(second.visibleVolume).toBe(1000)
    expect(second.estimatedClicks).toBeCloseTo(1000 * 0.15)

    expect(result.shares.reduce((sum, share) => sum + share.shareOfVoice, 0)).toBeCloseTo(1)
    expect(result.shares.reduce((sum, share) => sum + share.shareOfClicks, 0)).toBeCloseTo(1)
    expect(result.keywordCount).toBe(2)
  })

  it('keeps domains with no visible rankings at zero instead of dropping them', () => {
    const result = computeShareOfSearch(rows, ['a.com', 'b.com', 'c.com'])
    const absent = result.shares.find((share) => share.domain === 'c.com')
    expect(absent).toEqual({
      domain: 'c.com',
      keywordsRanked: 0,
      visibleVolume: 0,
      estimatedClicks: 0,
      shareOfVoice: 0,
      shareOfClicks: 0,
    })
  })

  it('ignores rows for domains outside the compared set', () => {
    const result = computeShareOfSearch(
      [...rows, { domain: 'z.com', phrase: 'ev suv', searchVolume: 9999, position: 1 }],
      ['a.com', 'b.com'],
    )
    expect(result.totalVisibleVolume).toBe(2500)
  })

  it('returns zero shares on empty input', () => {
    const result = computeShareOfSearch([], ['a.com'])
    expect(result.shares[0].shareOfVoice).toBe(0)
    expect(result.keywordCount).toBe(0)
  })
})
