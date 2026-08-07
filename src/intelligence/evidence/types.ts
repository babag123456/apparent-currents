/**
 * Canonical evidence model.
 *
 * Every record that enters the intelligence layer — regardless of vendor —
 * is expressed in these shapes. Vendor response objects must never travel
 * past their adapter; presentation and marker derivation consume only this.
 *
 * Signals converge around topic / audience / brand / category / market /
 * period. Records are aggregate audience intelligence: never person-level,
 * and never joined across sources by identity.
 */

/** The behavioural lens a piece of evidence belongs to. */
export type EvidenceLens = 'demand' | 'conversation' | 'behaviour' | 'people'

/** Data sources. Only Semrush is implemented; the rest are declared so the
 * model (and UI labelling) can be honest about what is and isn't wired up. */
export type EvidenceSource = 'semrush' | 'brandwatch' | 'ga4' | 'gwi'

/** Where and when a record came from. Required on every record. */
export interface Provenance {
  source: EvidenceSource
  /** Vendor-side report/endpoint identifier, e.g. "phrase_these". */
  sourceReport: string
  /** ISO timestamp of retrieval. */
  retrievedAt: string
  /** Vendor database / market identifier as requested, e.g. "au". */
  market: string
  /** Human description of the period the data covers, e.g. "latest" or "202607". */
  period: string
}

/** A 12-point relative interest series, oldest month first, values 0..1. */
export type TrendSeries = number[]

export type SearchIntent = 'commercial' | 'informational' | 'navigational' | 'transactional'

/**
 * Demand evidence: what people are actively searching for.
 * One record per keyword per market per retrieval.
 */
export interface DemandEvidence {
  lens: 'demand'
  provenance: Provenance
  /** The search phrase this record describes. */
  phrase: string
  /** The topic/keyword-set this phrase was queried under, if any. */
  topic?: string
  /** Domain this record was retrieved for (domain reports only). */
  domain?: string
  metrics: {
    /** Average monthly search volume. */
    searchVolume?: number
    /** Cost per click, USD. */
    cpc?: number
    /** Paid competition density 0..1. */
    competition?: number
    /** Number of results in the index. */
    resultsCount?: number
    /** 12-month relative interest, oldest first, 0..1. */
    trend?: TrendSeries
    /** Organic position (domain reports only). */
    position?: number
    /** Previous organic position (domain reports only). */
    previousPosition?: number
  }
  intents?: SearchIntent[]
}

/**
 * Conversation evidence: what people are talking about.
 * One record per theme per market per retrieval. No live Brandwatch
 * adapter exists yet — records only enter via authored fixtures.
 */
export interface ConversationEvidence {
  lens: 'conversation'
  provenance: Provenance
  /** The conversation theme this record describes. */
  phrase: string
  topic?: string
  metrics: {
    /** Mentions per month across tracked channels. */
    mentions?: number
    /** Net sentiment −1..1 (share positive minus share negative). */
    netSentiment?: number
    /** 12-month relative mention volume, oldest first, 0..1. */
    trend?: TrendSeries
  }
}

/**
 * Behaviour evidence: what people do on owned properties.
 * One record per page/content item per retrieval. No live GA4 adapter
 * exists yet — records only enter via authored fixtures.
 */
export interface BehaviourEvidence {
  lens: 'behaviour'
  provenance: Provenance
  /** The owned page or content item this record describes. */
  phrase: string
  topic?: string
  metrics: {
    /** Sessions per month. */
    sessions?: number
    /** Engaged-session share 0..1. */
    engagementRate?: number
    /** 12-month relative session volume, oldest first, 0..1. */
    trend?: TrendSeries
  }
}

/**
 * People evidence: who the audience is and what they care about.
 * One record per audience attribute per retrieval. No live GWI adapter
 * exists yet — records only enter via authored fixtures. Aggregate
 * audience attributes only — never person-level.
 */
export interface PeopleEvidence {
  lens: 'people'
  provenance: Provenance
  /** The audience attribute statement this record describes. */
  phrase: string
  topic?: string
  metrics: {
    /** Over/under-index vs the national average (1.0 = average). */
    audienceIndex?: number
    /** Share of the audience holding the attribute, 0..1. */
    audiencePct?: number
  }
}

/** Union of all canonical evidence records. */
export type Evidence = DemandEvidence | ConversationEvidence | BehaviourEvidence | PeopleEvidence
