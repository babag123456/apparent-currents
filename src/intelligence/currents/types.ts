import type { MarkerConfidence } from '../markers/types.ts'

/**
 * A Current is a pattern across related markers around a shared topic —
 * the middle tier of the intelligence hierarchy (Marker → Current →
 * Opportunity). Derived currents are machine clustering + status
 * heuristics over stored markers: interpretation, always labelled as
 * derived, never presented as source data.
 */

export type CurrentStatus = 'emerging' | 'accelerating' | 'established' | 'declining'
export type CurrentDirection = 'rising' | 'steady' | 'easing'

/** The marker fields derivation needs — a stored marker, DB-agnostic. */
export interface StoredMarker {
  id: number
  kind: 'demand-rising' | 'demand-declining' | 'high-demand'
  direction: 'up' | 'down' | 'flat'
  confidence: MarkerConfidence
  statement: string
  phrase: string
  topic?: string | null
  magnitude: number
}

export interface DerivedCurrent {
  /** Display identifier, C1… in derived rank order. */
  id: string
  /** The shared topic the cluster formed around. */
  topic: string
  /** Machine-derived headline — labelled as derived in the UI. */
  title: string
  status: CurrentStatus
  direction: CurrentDirection
  /** Mean signed trend change across the cluster's trend markers. */
  momentum: number
  momentumFigure: string
  /** Total monthly search volume across member phrases (when known). */
  totalVolume: number | null
  confidence: MarkerConfidence
  phrases: string[]
  markers: StoredMarker[]
}

export interface DeriveCurrentsResult {
  currents: DerivedCurrent[]
  /** Markers whose cluster was too thin to call a pattern (kept visible). */
  unclustered: StoredMarker[]
}
