import { describe, expect, it } from 'vitest'

import { SemrushApiError } from '../../integrations/semrush/client.ts'
import type { DemandEvidence } from '../evidence/types.ts'
import type { DemandMarker } from '../markers/types.ts'
import {
  dedupeByPhrase,
  evidenceToRecordData,
  markerToRecordData,
  sanitizedErrorMessage,
  syncStatusForError,
} from './mapping.ts'

function makeEvidence(phrase: string, overrides: Partial<DemandEvidence> = {}): DemandEvidence {
  return {
    lens: 'demand',
    phrase,
    provenance: {
      source: 'semrush',
      sourceReport: 'phrase_these',
      retrievedAt: '2026-08-07T00:00:00.000Z',
      market: 'au',
      period: 'latest',
    },
    metrics: { searchVolume: 1000, trend: [0.5, 0.6, 0.7] },
    ...overrides,
  }
}

describe('syncStatusForError', () => {
  it('maps an exhausted unit balance to quota-exceeded', () => {
    const error = new SemrushApiError('Semrush error 132: API UNITS BALANCE IS ZERO', {
      code: 132,
      httpStatus: 403,
    })
    expect(syncStatusForError(error)).toBe('quota-exceeded')
  })

  it('maps other API errors and unknown errors to failed', () => {
    expect(syncStatusForError(new SemrushApiError('nope', { code: 120 }))).toBe('failed')
    expect(syncStatusForError(new Error('socket hang up'))).toBe('failed')
    expect(syncStatusForError('string')).toBe('failed')
  })
})

describe('sanitizedErrorMessage', () => {
  it('caps length and tolerates non-Error values', () => {
    expect(sanitizedErrorMessage(new Error('x'.repeat(500)))).toHaveLength(300)
    expect(sanitizedErrorMessage(42)).toBe('Unknown error')
  })
})

describe('evidenceToRecordData', () => {
  it('maps canonical evidence onto the collection shape with provenance intact', () => {
    const data = evidenceToRecordData(
      makeEvidence('ev charging', { topic: 'ev charging', intents: ['commercial'] }),
      7,
      11,
    )
    expect(data).toMatchObject({
      lens: 'demand',
      source: 'semrush',
      kind: 'keyword',
      phrase: 'ev charging',
      topic: 'ev charging',
      context: 7,
      sync: 11,
      trend: [0.5, 0.6, 0.7],
      intents: ['commercial'],
    })
    expect((data.provenance as Record<string, unknown>).retrievedAt).toBe(
      '2026-08-07T00:00:00.000Z',
    )
  })

  it('marks domain evidence as domain-keyword', () => {
    const data = evidenceToRecordData(makeEvidence('audi ev', { domain: 'audi.com.au' }), 1, 2)
    expect(data.kind).toBe('domain-keyword')
    expect(data.domain).toBe('audi.com.au')
  })
})

describe('markerToRecordData', () => {
  it('resolves the evidence trail to stored record ids', () => {
    const evidenceA = makeEvidence('ev charging')
    const marker: DemandMarker = {
      kind: 'demand-rising',
      phrase: 'ev charging',
      market: 'au',
      direction: 'up',
      magnitude: 0.4,
      confidence: 'moderate',
      statement: 'Search interest in “ev charging” is rising.',
      sources: ['semrush'],
      derivedAt: '2026-08-07T00:00:00.000Z',
      evidence: [evidenceA],
    }
    const ids = new Map([['ev charging', 31]])
    const data = markerToRecordData(marker, 7, 11, ids)
    expect(data).toMatchObject({
      kind: 'demand-rising',
      phrase: 'ev charging',
      magnitude: 0.4,
      context: 7,
      sync: 11,
      evidence: [31],
    })
  })

  it('drops evidence whose record id is unknown rather than fabricating links', () => {
    const marker: DemandMarker = {
      kind: 'high-demand',
      phrase: 'ev range',
      market: 'au',
      direction: 'flat',
      magnitude: 6,
      confidence: 'strong',
      statement: 'x',
      sources: ['semrush'],
      derivedAt: '2026-08-07T00:00:00.000Z',
      evidence: [makeEvidence('ev range'), makeEvidence('unstored phrase')],
    }
    const data = markerToRecordData(marker, 1, 2, new Map([['ev range', 5]]))
    expect(data.evidence).toEqual([5])
  })
})

describe('dedupeByPhrase', () => {
  it('keeps the first occurrence of a phrase', () => {
    const first = makeEvidence('ev charging', { topic: 'primary' })
    const duplicate = makeEvidence('ev charging', { topic: 'related' })
    const other = makeEvidence('home ev charger')
    expect(dedupeByPhrase([first, duplicate, other])).toEqual([first, other])
  })

  it('treats the same phrase on different domains as distinct evidence', () => {
    const keyword = makeEvidence('ev charging')
    const domainKeyword = makeEvidence('ev charging', { domain: 'audi.com.au' })
    expect(dedupeByPhrase([keyword, domainKeyword])).toHaveLength(2)
  })
})
