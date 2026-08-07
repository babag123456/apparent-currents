import React from 'react'

import type { CompetitorVisibilityFixture } from '../../fixtures/competitorVisibility.ts'
import { classifyPhrase } from '../../../../intelligence/classification/classifyPhrase.ts'
import {
  computeShareOfSearch,
  CTR_BEYOND_TEN,
  ORGANIC_CTR_BY_POSITION,
  VISIBILITY_FLOOR_POSITION,
} from '../../../../intelligence/share/shareOfSearch.ts'

function pct(share: number): string {
  return `${Math.round(share * 100)}%`
}

/** Estimated clicks stay estimates: rounded to the nearest 10 and marked ~. */
function clicksLabel(clicks: number): string {
  return `~${(Math.round(clicks / 10) * 10).toLocaleString('en-AU')}`
}

/**
 * The competitive stack-up: share of voice and share of clicks across the
 * context's brand and competitor domains, over a shared keyword set. Both
 * shares are plain fractions with their components in the table, and the
 * CTR curve behind estimated clicks is disclosed in the foot — no
 * composite score anywhere. The brand's biggest absences from the set
 * close the section, because where you don't rank is the finding.
 */
export function CompetitiveStackUp({
  fixture,
  labelledBy,
}: {
  fixture: CompetitorVisibilityFixture
  labelledBy: string
}) {
  const domainOrder = fixture.domains.map((entry) => entry.domain)
  const nameByDomain = new Map(fixture.domains.map((entry) => [entry.domain, entry]))
  const result = computeShareOfSearch(fixture.rows, domainOrder)

  // The brand's gaps: addressable set phrases (competitor badge terms
  // excluded — nobody expects Audi to rank on "bmw i4") with no visible
  // brand ranking, by volume.
  const brandEntry = fixture.domains.find((entry) => entry.isBrand)
  const brandDomain = brandEntry?.domain
  const classifierContext = {
    brand: brandEntry?.name ?? '',
    competitors: fixture.domains.filter((entry) => !entry.isBrand).map((entry) => entry.name),
  }
  const phraseVolumes = new Map(fixture.rows.map((row) => [row.phrase, row.searchVolume]))
  const brandPhrases = new Set(
    fixture.rows
      .filter((row) => row.domain === brandDomain && row.position <= VISIBILITY_FLOOR_POSITION)
      .map((row) => row.phrase),
  )
  const addressable = [...phraseVolumes.entries()].filter(
    ([phrase]) => classifyPhrase(phrase, classifierContext) !== 'competitor',
  )
  const gaps = addressable
    .filter(([phrase]) => !brandPhrases.has(phrase))
    .sort(([, a], [, b]) => b - a)

  return (
    <div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby={labelledBy}>
        <table className="mt-1 w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-charcoal/10 font-mono text-[10px] uppercase tracking-[0.16em] text-red-text">
              <th scope="col" className="py-2.5 pr-4 font-medium">Domain</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Keywords ranked</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Visible volume/mo</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Share of voice</th>
              <th scope="col" className="py-2.5 pr-4 font-medium">Est. clicks/mo</th>
              <th scope="col" className="py-2.5 font-medium">Share of clicks</th>
            </tr>
          </thead>
          <tbody>
            {result.shares.map((share) => {
              const meta = nameByDomain.get(share.domain)
              const isBrand = Boolean(meta?.isBrand)
              return (
                <tr key={share.domain} className="border-b border-charcoal/10">
                  <td className="py-3 pr-4">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[14px] font-medium text-charcoal">
                        {meta?.name ?? share.domain}
                      </span>
                      {isBrand ? (
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-text">
                          you
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-[11px] text-charcoal/70">{share.domain}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-[12px] text-charcoal/80">
                    {share.keywordsRanked} of {result.keywordCount}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[12px] text-charcoal/80">
                    {share.visibleVolume.toLocaleString('en-AU')}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-[13px] font-medium text-charcoal">
                      {pct(share.shareOfVoice)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-1.5 block h-[3px] w-full max-w-[9rem] rounded-full bg-charcoal/10"
                    >
                      <span
                        className={`block h-full rounded-full ${isBrand ? 'bg-red' : 'bg-charcoal/45'}`}
                        style={{ width: `${Math.max(share.shareOfVoice * 100, share.visibleVolume > 0 ? 1 : 0)}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-[12px] text-charcoal/80">
                    {clicksLabel(share.estimatedClicks)}
                  </td>
                  <td className="py-3 font-mono text-[13px] font-medium text-charcoal">
                    {pct(share.shareOfClicks)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {gaps.length > 0 && nameByDomain.get(brandDomain ?? '') ? (
        <p className="mt-4 max-w-[72ch] text-[13.5px] leading-relaxed text-charcoal/70">
          <span className="font-medium text-charcoal">Where {nameByDomain.get(brandDomain!)!.name} is absent:</span>{' '}
          not visible on {gaps.length} of the set’s {addressable.length} addressable phrases
          (competitor badge terms excluded) —{' '}
          {gaps
            .slice(0, 3)
            .map(([phrase, volume]) => `“${phrase}” (${volume.toLocaleString('en-AU')}/mo)`)
            .join(', ')}
          {gaps.length > 3 ? ', …' : ''}. Unclaimed demand the competitor set is already ranking on.
        </p>
      ) : null}

      <p className="mt-4 max-w-[80ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
        Share of voice = a domain’s visible search volume ÷ the compared set’s total
        (visible = ranking in the top {VISIBILITY_FLOOR_POSITION}) · share of clicks =
        estimated clicks ÷ set total, using industry-average organic CTR by position (
        {ORGANIC_CTR_BY_POSITION.slice(0, 3)
          .map((ctr) => pct(ctr))
          .join(' · ')}{' '}
        for positions 1–3, down to {pct(CTR_BEYOND_TEN)} past position 10) — estimates, not
        measured clicks · share of market is not shown: it needs external sales or
        registration data, which is not connected
      </p>
    </div>
  )
}
