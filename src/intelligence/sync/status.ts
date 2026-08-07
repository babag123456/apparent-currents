/**
 * Cache / stale / duplicate-prevention logic for metered sync runs.
 * Pure functions over sync records so the policy is testable without a
 * database. Times are ISO strings as stored on data-syncs.
 */

/** Evidence younger than this is presented as fresh. */
export const FRESH_FOR_HOURS = 24
/** Minimum gap between successful metered imports for one context+source. */
export const COOLDOWN_MINUTES = 60
/** A run older than this that never finished is treated as stalled. */
export const STALLED_AFTER_MINUTES = 15

export type SyncFreshness = 'fresh' | 'stale'

export interface SyncSnapshot {
  status: 'running' | 'succeeded' | 'failed' | 'quota-exceeded'
  startedAt: string
  finishedAt?: string | null
}

const HOUR_MS = 3_600_000
const MINUTE_MS = 60_000

export function syncFreshness(finishedAt: string, now: Date = new Date()): SyncFreshness {
  const age = now.getTime() - new Date(finishedAt).getTime()
  return age <= FRESH_FOR_HOURS * HOUR_MS ? 'fresh' : 'stale'
}

export type StartRefusal = 'running' | 'cooldown'

export interface StartDecision {
  allowed: boolean
  reason?: StartRefusal
  /** Milliseconds until a refused start becomes allowed (cooldown only). */
  retryInMs?: number
}

/**
 * Whether a new metered import may start, given the latest sync for the
 * same context + source. A running sync blocks unless it has stalled; a
 * recent successful sync enforces the cooldown. Failed and quota runs may
 * be retried immediately — the user is explicitly acting on an error.
 */
export function canStartSync(latest: SyncSnapshot | null, now: Date = new Date()): StartDecision {
  if (!latest) return { allowed: true }

  if (latest.status === 'running') {
    const runningFor = now.getTime() - new Date(latest.startedAt).getTime()
    if (runningFor < STALLED_AFTER_MINUTES * MINUTE_MS) {
      return { allowed: false, reason: 'running' }
    }
    return { allowed: true }
  }

  if (latest.status === 'succeeded' && latest.finishedAt) {
    const sinceFinish = now.getTime() - new Date(latest.finishedAt).getTime()
    const cooldown = COOLDOWN_MINUTES * MINUTE_MS
    if (sinceFinish < cooldown) {
      return { allowed: false, reason: 'cooldown', retryInMs: cooldown - sinceFinish }
    }
  }

  return { allowed: true }
}
