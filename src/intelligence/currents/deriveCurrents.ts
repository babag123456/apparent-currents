import type { MarkerConfidence } from '../markers/types.ts'
import type {
  CurrentDirection,
  CurrentStatus,
  DeriveCurrentsResult,
  DerivedCurrent,
  StoredMarker,
} from './types.ts'

/**
 * Current derivation, heuristics v0: cluster markers by their topic and
 * read a status off each cluster. Deliberately simple and inspectable —
 * thresholds are documented constants, every current carries its member
 * markers, and the output is interpretation, labelled as derived.
 *
 * Known v0 limits (documented, not hidden): clustering is strictly by the
 * topic field markers inherit from evidence; a cluster needs at least
 * MIN_CLUSTER_MARKERS markers before it is called a pattern (thinner
 * signals are returned as unclustered, still visible in Deep Dive); and
 * phrases whose evidence produced no markers produce no current — the
 * derivation only surfaces movement, so a flat established cluster with
 * no high-demand marker stays silent.
 */

/** A pattern needs at least this many corroborating markers. */
export const MIN_CLUSTER_MARKERS = 2
/** Mean trend change that separates steady from rising/easing. */
export const DIRECTION_THRESHOLD = 0.25
/** Total monthly volume above which a rising cluster is accelerating
 * rather than emerging. */
export const ACCELERATING_VOLUME_FLOOR = 10_000

const CONFIDENCE_RANK: Record<MarkerConfidence, number> = { weak: 0, moderate: 1, strong: 2 }

function pct(value: number): string {
  return `${value >= 0 ? '+' : '−'}${Math.abs(Math.round(value * 100))}%`
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function clusterConfidence(markers: StoredMarker[]): MarkerConfidence {
  const best = markers.reduce<MarkerConfidence>(
    (acc, marker) => (CONFIDENCE_RANK[marker.confidence] > CONFIDENCE_RANK[acc] ? marker.confidence : acc),
    'weak',
  )
  // A single-source-of-truth cluster is never more confident than its
  // corroboration: with only the minimum member count, step down once.
  if (markers.length > MIN_CLUSTER_MARKERS) return best
  return best === 'strong' ? 'moderate' : best
}

function statusFor(momentum: number | null, totalVolume: number | null): CurrentStatus {
  if (momentum === null) return 'established'
  if (momentum <= -DIRECTION_THRESHOLD) return 'declining'
  if (momentum >= DIRECTION_THRESHOLD) {
    return totalVolume !== null && totalVolume >= ACCELERATING_VOLUME_FLOOR
      ? 'accelerating'
      : 'emerging'
  }
  return 'established'
}

function directionFor(momentum: number | null): CurrentDirection {
  if (momentum === null) return 'steady'
  if (momentum >= DIRECTION_THRESHOLD) return 'rising'
  if (momentum <= -DIRECTION_THRESHOLD) return 'easing'
  return 'steady'
}

function titleFor(topic: string, status: CurrentStatus): string {
  switch (status) {
    case 'accelerating':
      return `Demand around “${topic}” is accelerating`
    case 'emerging':
      return `Demand around “${topic}” is forming`
    case 'declining':
      return `Demand around “${topic}” is easing`
    case 'established':
      return `Demand around “${topic}” is holding`
  }
}

export interface DeriveCurrentsOptions {
  /** Monthly search volume per phrase, from the evidence records. */
  volumesByPhrase?: Map<string, number>
}

export function deriveCurrents(
  markers: StoredMarker[],
  options: DeriveCurrentsOptions = {},
): DeriveCurrentsResult {
  const clusters = new Map<string, StoredMarker[]>()
  for (const marker of markers) {
    const key = (marker.topic ?? marker.phrase).trim().toLowerCase()
    const members = clusters.get(key)
    if (members) members.push(marker)
    else clusters.set(key, [marker])
  }

  const currents: Omit<DerivedCurrent, 'id'>[] = []
  const unclustered: StoredMarker[] = []

  for (const [topic, members] of clusters) {
    if (members.length < MIN_CLUSTER_MARKERS) {
      unclustered.push(...members)
      continue
    }

    const trendMarkers = members.filter((m) => m.kind !== 'high-demand')
    const momentum = trendMarkers.length ? mean(trendMarkers.map((m) => m.magnitude)) : null

    const phrases = [...new Set(members.map((m) => m.phrase))]
    const volumes = options.volumesByPhrase
      ? phrases
          .map((phrase) => options.volumesByPhrase?.get(phrase))
          .filter((v): v is number => typeof v === 'number')
      : []
    const totalVolume = volumes.length ? volumes.reduce((sum, v) => sum + v, 0) : null

    const status = statusFor(momentum, totalVolume)

    currents.push({
      topic,
      title: titleFor(topic, status),
      status,
      direction: directionFor(momentum),
      momentum: momentum ?? 0,
      momentumFigure: momentum === null ? '±0%' : pct(momentum),
      totalVolume,
      confidence: clusterConfidence(members),
      phrases,
      markers: members,
    })
  }

  currents.sort((a, b) => {
    // Movement first, then weight of evidence behind it.
    const byMomentum = Math.abs(b.momentum) - Math.abs(a.momentum)
    if (byMomentum !== 0) return byMomentum
    return b.markers.length - a.markers.length
  })

  return {
    currents: currents.map((current, index) => ({ ...current, id: `C${index + 1}` })),
    unclustered,
  }
}
