/**
 * Share of search: transparent competitive ratios over domain-keyword
 * evidence (which domains rank where, for a shared keyword set).
 *
 * Two ratios, each a plain fraction whose components are returned so the
 * UI can show them — never a composite or weighted blend:
 *
 * - **Share of voice** — visibility share. A domain is "visible" on a
 *   keyword when it ranks at or above VISIBILITY_FLOOR_POSITION; its
 *   visible volume is the sum of those keywords' monthly search volumes.
 *   SoV = domain visible volume ÷ total visible volume across the
 *   compared domains.
 * - **Share of clicks** — estimated-click share. Each ranking earns
 *   volume × CTR(position) using the published-average organic CTR curve
 *   below; SoC = domain estimated clicks ÷ total estimated clicks.
 *
 * Share of market is deliberately absent: it needs external sales or
 * registration data, not search data, and is not computed here.
 *
 * The same computation serves authored fixture rows today and live
 * Semrush domain_organic evidence when domain imports are wired up.
 */

export interface DomainKeywordRow {
  domain: string
  phrase: string
  /** Monthly search volume of the phrase. */
  searchVolume: number
  /** Organic position the domain holds for the phrase (1 = top). */
  position: number
}

/**
 * Industry-average organic CTR by position 1–10 (approximate published
 * averages, not measured for this market). An estimate curve, disclosed
 * in the UI — never presented as observed clicks.
 */
export const ORGANIC_CTR_BY_POSITION = [
  0.32, 0.15, 0.1, 0.073, 0.053, 0.04, 0.031, 0.025, 0.02, 0.016,
] as const

/** Flat CTR estimate applied to positions 11 through the visibility floor. */
export const CTR_BEYOND_TEN = 0.01

/** Rankings below this position count as not visible. */
export const VISIBILITY_FLOOR_POSITION = 20

export function ctrForPosition(position: number): number {
  if (position < 1 || position > VISIBILITY_FLOOR_POSITION) return 0
  return ORGANIC_CTR_BY_POSITION[position - 1] ?? CTR_BEYOND_TEN
}

export interface DomainShare {
  domain: string
  /** Keywords (of the shared set) the domain is visible on. */
  keywordsRanked: number
  /** Sum of search volume across visible keywords. */
  visibleVolume: number
  /** Sum of volume × CTR(position) across visible keywords. */
  estimatedClicks: number
  /** visibleVolume ÷ total visibleVolume, 0..1. */
  shareOfVoice: number
  /** estimatedClicks ÷ total estimatedClicks, 0..1. */
  shareOfClicks: number
}

export interface ShareOfSearchResult {
  /** One entry per compared domain, sorted by share of voice descending. */
  shares: DomainShare[]
  /** Distinct phrases in the compared set (visible rankings only). */
  keywordCount: number
  totalVisibleVolume: number
  totalEstimatedClicks: number
}

/**
 * Compute both shares for a set of domains. `domains` fixes the compared
 * set (and its order for ties) so a domain with no visible rankings still
 * appears with zeros instead of vanishing.
 */
export function computeShareOfSearch(
  rows: DomainKeywordRow[],
  domains: string[],
): ShareOfSearchResult {
  const byDomain = new Map<string, { keywordsRanked: number; visibleVolume: number; estimatedClicks: number }>(
    domains.map((domain) => [domain, { keywordsRanked: 0, visibleVolume: 0, estimatedClicks: 0 }]),
  )
  const phrases = new Set<string>()

  for (const row of rows) {
    const totals = byDomain.get(row.domain)
    if (!totals) continue
    const ctr = ctrForPosition(row.position)
    if (ctr === 0) continue
    totals.keywordsRanked += 1
    totals.visibleVolume += row.searchVolume
    totals.estimatedClicks += row.searchVolume * ctr
    phrases.add(row.phrase)
  }

  const totalVisibleVolume = [...byDomain.values()].reduce((sum, d) => sum + d.visibleVolume, 0)
  const totalEstimatedClicks = [...byDomain.values()].reduce((sum, d) => sum + d.estimatedClicks, 0)

  const shares: DomainShare[] = domains
    .map((domain) => {
      const totals = byDomain.get(domain)!
      return {
        domain,
        ...totals,
        shareOfVoice: totalVisibleVolume > 0 ? totals.visibleVolume / totalVisibleVolume : 0,
        shareOfClicks: totalEstimatedClicks > 0 ? totals.estimatedClicks / totalEstimatedClicks : 0,
      }
    })
    .sort((a, b) => b.shareOfVoice - a.shareOfVoice)

  return { shares, keywordCount: phrases.size, totalVisibleVolume, totalEstimatedClicks }
}
