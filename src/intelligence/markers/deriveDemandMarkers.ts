import type { DemandEvidence } from '../evidence/types.ts'
import type { DemandMarker, MarkerConfidence } from './types.ts'

/**
 * Demand marker derivation, heuristics v0.
 *
 * Deliberately simple and inspectable — thresholds are documented constants,
 * every marker carries the evidence it came from, and confidence is a coarse
 * label, not a statistical claim. Refine with real data before trusting.
 */

/** Recent window = last 3 points of the 12-month trend series. */
const RECENT_MONTHS = 3
/** Relative change in recent vs baseline interest that counts as movement. */
const TREND_CHANGE_THRESHOLD = 0.25
/** Change beyond this is labelled strong (with sufficient volume). */
const TREND_STRONG_THRESHOLD = 0.6
/** Multiple of the set's median volume that counts as outsized demand. */
const HIGH_DEMAND_MEDIAN_MULTIPLE = 5
/** Below this volume a trend signal is too thin to trust beyond 'weak'. */
const LOW_VOLUME_FLOOR = 100

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Relative change of recent interest vs the preceding baseline.
 * Returns null when the series is too short or the baseline is ~zero
 * (a zero baseline would make any movement read as infinite growth).
 */
export function trendChange(trend: number[] | undefined): number | null {
  if (!trend || trend.length < RECENT_MONTHS * 2) return null
  const recent = trend.slice(-RECENT_MONTHS)
  const baseline = trend.slice(0, trend.length - RECENT_MONTHS)
  const baselineMean = mean(baseline)
  if (baselineMean < 0.05) return null
  return (mean(recent) - baselineMean) / baselineMean
}

function trendConfidence(change: number, volume: number | undefined): MarkerConfidence {
  if (!volume || volume < LOW_VOLUME_FLOOR) return 'weak'
  return Math.abs(change) >= TREND_STRONG_THRESHOLD ? 'strong' : 'moderate'
}

function pct(value: number): string {
  return `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`
}

/**
 * Derive demand markers from a set of demand evidence records
 * (typically one keyword set, one market, one retrieval).
 */
export function deriveDemandMarkers(evidence: DemandEvidence[]): DemandMarker[] {
  const markers: DemandMarker[] = []
  const derivedAt = new Date().toISOString()

  const volumes = evidence
    .map((e) => e.metrics.searchVolume)
    .filter((v): v is number => typeof v === 'number' && v > 0)
  const medianVolume = volumes.length ? median(volumes) : null

  for (const record of evidence) {
    const { phrase, topic, metrics, provenance } = record
    const base = {
      phrase,
      topic,
      market: provenance.market,
      sources: [provenance.source],
      derivedAt,
      evidence: [record],
    }

    const change = trendChange(metrics.trend)
    if (change !== null && Math.abs(change) >= TREND_CHANGE_THRESHOLD) {
      const rising = change > 0
      markers.push({
        ...base,
        kind: rising ? 'demand-rising' : 'demand-declining',
        direction: rising ? 'up' : 'down',
        magnitude: change,
        confidence: trendConfidence(change, metrics.searchVolume),
        statement: `Search interest in “${phrase}” is ${rising ? 'up' : 'down'} ${pct(
          change,
        )} in the last ${RECENT_MONTHS} months vs the preceding baseline.`,
      })
    }

    if (
      medianVolume !== null &&
      volumes.length >= 4 &&
      typeof metrics.searchVolume === 'number' &&
      medianVolume > 0 &&
      metrics.searchVolume >= medianVolume * HIGH_DEMAND_MEDIAN_MULTIPLE
    ) {
      const multiple = metrics.searchVolume / medianVolume
      markers.push({
        ...base,
        kind: 'high-demand',
        direction: 'flat',
        magnitude: multiple,
        confidence: 'moderate',
        statement: `“${phrase}” carries ${Math.round(multiple)}× the median search volume of this set.`,
      })
    }
  }

  return markers
}
