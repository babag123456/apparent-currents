import { describe, expect, it } from 'vitest'

import {
  ACCELERATING_VOLUME_FLOOR,
  MIN_CLUSTER_MARKERS,
  deriveCurrents,
} from './deriveCurrents.ts'
import type { StoredMarker } from './types.ts'

let nextId = 1
function marker(overrides: Partial<StoredMarker>): StoredMarker {
  return {
    id: nextId++,
    kind: 'demand-rising',
    direction: 'up',
    confidence: 'moderate',
    statement: 'x',
    phrase: 'phrase',
    topic: 'topic',
    magnitude: 0.5,
    ...overrides,
  }
}

describe('deriveCurrents clustering', () => {
  it('clusters markers by topic and keeps thin clusters out of the pattern list', () => {
    const markers = [
      marker({ topic: 'charging', phrase: 'ev charging', magnitude: 0.4 }),
      marker({ topic: 'charging', phrase: 'home ev charger', magnitude: 0.6 }),
      marker({ topic: 'challengers', phrase: 'byd vs audi', magnitude: 1.2 }),
    ]
    const { currents, unclustered } = deriveCurrents(markers)
    expect(currents).toHaveLength(1)
    expect(currents[0].topic).toBe('charging')
    expect(currents[0].markers).toHaveLength(2)
    expect(unclustered).toHaveLength(1)
    expect(unclustered[0].phrase).toBe('byd vs audi')
  })

  it('falls back to the phrase when a marker has no topic', () => {
    const markers = [
      marker({ topic: null, phrase: 'ev charging', magnitude: 0.3 }),
      marker({ topic: null, phrase: 'ev charging', kind: 'high-demand', direction: 'flat', magnitude: 6 }),
    ]
    const { currents } = deriveCurrents(markers)
    expect(currents).toHaveLength(1)
    expect(currents[0].topic).toBe('ev charging')
  })
})

describe('deriveCurrents status', () => {
  it('labels a high-volume rising cluster accelerating', () => {
    const markers = [
      marker({ topic: 'charging', phrase: 'ev charging', magnitude: 0.5 }),
      marker({ topic: 'charging', phrase: 'home ev charger', magnitude: 0.7 }),
    ]
    const volumes = new Map([
      ['ev charging', ACCELERATING_VOLUME_FLOOR],
      ['home ev charger', 4400],
    ])
    const { currents } = deriveCurrents(markers, { volumesByPhrase: volumes })
    expect(currents[0].status).toBe('accelerating')
    expect(currents[0].direction).toBe('rising')
    expect(currents[0].totalVolume).toBe(ACCELERATING_VOLUME_FLOOR + 4400)
  })

  it('labels a low-volume rising cluster emerging', () => {
    const markers = [
      marker({ topic: 'hedge', phrase: 'phev vs ev', magnitude: 0.8 }),
      marker({ topic: 'hedge', phrase: 'audi phev', magnitude: 0.9 }),
    ]
    const { currents } = deriveCurrents(markers, {
      volumesByPhrase: new Map([
        ['phev vs ev', 1300],
        ['audi phev', 640],
      ]),
    })
    expect(currents[0].status).toBe('emerging')
  })

  it('labels a declining cluster declining with a signed momentum figure', () => {
    const markers = [
      marker({ topic: 'badge', phrase: 'audi e-tron', kind: 'demand-declining', direction: 'down', magnitude: -0.29 }),
      marker({ topic: 'badge', phrase: 'audi e-tron price', kind: 'demand-declining', direction: 'down', magnitude: -0.31 }),
    ]
    const { currents } = deriveCurrents(markers)
    expect(currents[0].status).toBe('declining')
    expect(currents[0].direction).toBe('easing')
    expect(currents[0].momentumFigure).toBe('−30%')
  })

  it('labels a cluster of only high-demand markers established and steady', () => {
    const markers = [
      marker({ topic: 'range', phrase: 'electric car range', kind: 'high-demand', direction: 'flat', magnitude: 5 }),
      marker({ topic: 'range', phrase: 'ev range australia', kind: 'high-demand', direction: 'flat', magnitude: 5 }),
    ]
    const { currents } = deriveCurrents(markers)
    expect(currents[0].status).toBe('established')
    expect(currents[0].direction).toBe('steady')
    expect(currents[0].momentumFigure).toBe('±0%')
  })
})

describe('deriveCurrents confidence and order', () => {
  it('steps confidence down when corroboration is at the minimum', () => {
    const thin = deriveCurrents([
      marker({ topic: 't', phrase: 'a', confidence: 'strong' }),
      marker({ topic: 't', phrase: 'b', confidence: 'strong' }),
    ])
    expect(thin.currents[0].confidence).toBe('moderate')

    const corroborated = deriveCurrents([
      marker({ topic: 't', phrase: 'a', confidence: 'strong' }),
      marker({ topic: 't', phrase: 'b', confidence: 'strong' }),
      marker({ topic: 't', phrase: 'c', confidence: 'weak' }),
    ])
    expect(corroborated.currents[0].confidence).toBe('strong')
    expect(MIN_CLUSTER_MARKERS).toBe(2)
  })

  it('ranks currents by absolute momentum and assigns C-ids in order', () => {
    const { currents } = deriveCurrents([
      marker({ topic: 'slow', phrase: 'a', magnitude: 0.3 }),
      marker({ topic: 'slow', phrase: 'b', magnitude: 0.3 }),
      marker({ topic: 'fast', phrase: 'c', magnitude: 1.1 }),
      marker({ topic: 'fast', phrase: 'd', magnitude: 0.9 }),
    ])
    expect(currents.map((c) => [c.id, c.topic])).toEqual([
      ['C1', 'fast'],
      ['C2', 'slow'],
    ])
  })
})
