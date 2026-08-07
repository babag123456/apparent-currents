import { describe, expect, it } from 'vitest'

import {
  COOLDOWN_MINUTES,
  FRESH_FOR_HOURS,
  STALLED_AFTER_MINUTES,
  canStartSync,
  syncFreshness,
} from './status.ts'

const NOW = new Date('2026-08-07T12:00:00.000Z')

function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString()
}

describe('syncFreshness', () => {
  it('reports fresh inside the freshness window', () => {
    expect(syncFreshness(minutesAgo(30), NOW)).toBe('fresh')
    expect(syncFreshness(minutesAgo(FRESH_FOR_HOURS * 60 - 1), NOW)).toBe('fresh')
  })

  it('reports stale beyond the freshness window', () => {
    expect(syncFreshness(minutesAgo(FRESH_FOR_HOURS * 60 + 1), NOW)).toBe('stale')
  })
})

describe('canStartSync', () => {
  it('allows the first ever sync', () => {
    expect(canStartSync(null, NOW)).toEqual({ allowed: true })
  })

  it('blocks while a sync is running', () => {
    const decision = canStartSync({ status: 'running', startedAt: minutesAgo(2) }, NOW)
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe('running')
  })

  it('treats a long-running sync as stalled and allows a retry', () => {
    const decision = canStartSync(
      { status: 'running', startedAt: minutesAgo(STALLED_AFTER_MINUTES + 1) },
      NOW,
    )
    expect(decision.allowed).toBe(true)
  })

  it('enforces the cooldown after a successful sync', () => {
    const decision = canStartSync(
      { status: 'succeeded', startedAt: minutesAgo(20), finishedAt: minutesAgo(15) },
      NOW,
    )
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toBe('cooldown')
    expect(decision.retryInMs).toBe((COOLDOWN_MINUTES - 15) * 60_000)
  })

  it('allows a new sync once the cooldown has passed', () => {
    const decision = canStartSync(
      {
        status: 'succeeded',
        startedAt: minutesAgo(COOLDOWN_MINUTES + 10),
        finishedAt: minutesAgo(COOLDOWN_MINUTES + 5),
      },
      NOW,
    )
    expect(decision.allowed).toBe(true)
  })

  it('allows an immediate retry after failure or quota exhaustion', () => {
    expect(
      canStartSync(
        { status: 'failed', startedAt: minutesAgo(3), finishedAt: minutesAgo(2) },
        NOW,
      ).allowed,
    ).toBe(true)
    expect(
      canStartSync(
        { status: 'quota-exceeded', startedAt: minutesAgo(3), finishedAt: minutesAgo(2) },
        NOW,
      ).allowed,
    ).toBe(true)
  })
})
