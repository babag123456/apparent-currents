import type { DemandEvidence, EvidenceSource } from '../evidence/types.ts'

/**
 * A Marker is an individual meaningful signal derived from evidence —
 * the smallest unit of interpretation. Currents (patterns across markers)
 * and Opportunities (convergence of currents) are built on top of these
 * in later phases.
 *
 * Every marker must be traceable to the evidence that produced it.
 */

export type DemandMarkerKind =
  /** Interest in a phrase is rising over the recent months. */
  | 'demand-rising'
  /** Interest in a phrase is declining over the recent months. */
  | 'demand-declining'
  /** A phrase carries outsized volume relative to the analyzed set. */
  | 'high-demand'

export type MarkerDirection = 'up' | 'down' | 'flat'

/** Honest, coarse evidence-strength label. Not a statistical claim. */
export type MarkerConfidence = 'weak' | 'moderate' | 'strong'

export interface DemandMarker {
  kind: DemandMarkerKind
  /** The phrase the signal is about. */
  phrase: string
  /** Topic/keyword-set context inherited from the evidence, if any. */
  topic?: string
  market: string
  direction: MarkerDirection
  /**
   * Signed relative change that triggered the marker, e.g. 0.4 = +40%.
   * For high-demand markers this is the multiple of the set median.
   */
  magnitude: number
  confidence: MarkerConfidence
  /** One-sentence plain-language statement of the signal. */
  statement: string
  sources: EvidenceSource[]
  /** ISO timestamp of derivation. */
  derivedAt: string
  /** The evidence records this marker was derived from. */
  evidence: DemandEvidence[]
}
