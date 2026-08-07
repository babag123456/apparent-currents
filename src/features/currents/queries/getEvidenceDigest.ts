import { COMPETITOR_TRAFFIC_FIXTURE } from '../fixtures/competitorTraffic.ts'
import { COMPETITOR_VISIBILITY_FIXTURE } from '../fixtures/competitorVisibility.ts'
import { OPEN_DATASETS_FIXTURE } from '../fixtures/openDatasets.ts'
import { PR_PUBLICATIONS_FIXTURE } from '../fixtures/prPublications.ts'
import { computeShareOfSearch } from '../../../intelligence/share/shareOfSearch.ts'
import { getLensFixture } from './getLensFixture.ts'
import { getSurfaceBulletin } from './getSurfaceBulletin.ts'

/**
 * Build the compact plain-text evidence digest that grounds "Ask the
 * evidence". Everything the product shows, nothing it doesn't: the same
 * queries and fixture modules as the pages, with the same honesty labels
 * (fixture / synthetic / live) attached — so the model can only talk
 * about what a user could verify on screen, provenance included.
 */

function pct(share: number): string {
  return `${Math.round(share * 100)}%`
}

export async function getEvidenceDigest(): Promise<string> {
  const [bulletin, conversation, behaviour, people] = await Promise.all([
    getSurfaceBulletin(),
    getLensFixture('conversation'),
    getLensFixture('behaviour'),
    getLensFixture('people'),
  ])

  const lines: string[] = []
  const modeLabel =
    bulletin.mode === 'authored-fixture'
      ? 'authored fixture (no imported data)'
      : bulletin.mode === 'derived-synthetic'
        ? 'machine-derived over authored synthetic fixture evidence'
        : 'machine-derived over live imported evidence'

  lines.push(`BULLETIN (${modeLabel}) — issued ${bulletin.issued}, period ${bulletin.period}`)
  lines.push(`Lead: ${bulletin.lead.statement} ${bulletin.lead.dek}`)

  lines.push('', 'CURRENTS (patterns across markers):')
  for (const current of bulletin.currents) {
    lines.push(
      `- ${current.id} "${current.title}" — ${current.status}, ${current.momentum}, ` +
        `${current.confidence} confidence, ${current.magnitude}. ${current.summary}`,
    )
    for (const marker of current.markers) {
      lines.push(
        `    marker [${marker.source}${marker.sourceConnected === false ? ', source not connected' : ''}` +
          `${marker.alignment ? `, ${marker.alignment}` : ''}]: ${marker.statement} (${marker.metric})`,
      )
    }
  }

  lines.push('', 'OPPORTUNITIES (authored strategic interpretation, never generated):')
  for (const opportunity of bulletin.opportunities) {
    lines.push(
      `- "${opportunity.title}" (converges from ${opportunity.convergesFrom.join(' + ')}): ${opportunity.narrative}`,
    )
  }

  const lensDump = (
    label: string,
    data: Awaited<ReturnType<typeof getLensFixture>>,
    metric: (record: NonNullable<typeof data>['evidence'][number]) => string,
  ) => {
    if (!data?.sync) {
      lines.push('', `${label}: source not connected, no fixture seeded — no evidence available.`)
      return
    }
    lines.push('', `${label} (authored synthetic fixture — source not connected):`)
    for (const record of data.evidence) {
      lines.push(`- ${record.phrase}: ${metric(record)}`)
    }
  }

  lensDump('CONVERSATION themes (Brandwatch-shaped)', conversation, (r) =>
    `${r.metrics?.mentions?.toLocaleString('en-AU') ?? '?'} mentions/mo, net sentiment ${r.metrics?.netSentiment ?? '?'}`,
  )
  lensDump('BEHAVIOUR own-site pages (GA4-shaped)', behaviour, (r) =>
    `${r.metrics?.sessions?.toLocaleString('en-AU') ?? '?'} sessions/mo, engagement ${typeof r.metrics?.engagementRate === 'number' ? pct(r.metrics.engagementRate) : '?'}`,
  )
  lensDump('PEOPLE audience attributes (GWI-shaped)', people, (r) =>
    `${r.metrics?.audienceIndex ?? '?'}x national index, ${typeof r.metrics?.audiencePct === 'number' ? pct(r.metrics.audiencePct) : '?'} of audience`,
  )

  const stackup = computeShareOfSearch(
    COMPETITOR_VISIBILITY_FIXTURE.rows,
    COMPETITOR_VISIBILITY_FIXTURE.domains.map((d) => d.domain),
  )
  lines.push('', 'COMPETITIVE STACK-UP, search (authored synthetic fixture):')
  for (const share of stackup.shares) {
    lines.push(
      `- ${share.domain}: ${share.keywordsRanked}/${stackup.keywordCount} keywords, ` +
        `share of voice ${pct(share.shareOfVoice)}, share of clicks ${pct(share.shareOfClicks)}`,
    )
  }
  lines.push(
    'Share of market is NOT computed anywhere — it needs external sales/registration data (see open datasets).',
  )

  lines.push('', 'PR & PUBLICATIONS (authored synthetic fixture):')
  for (const publication of PR_PUBLICATIONS_FIXTURE.publications) {
    lines.push(
      `- ${publication.name} (${publication.readFor}): ${publication.categoryItems} category items/mo; ` +
        publication.brandItems.map((b) => `${b.brand} ${b.items}`).join(', ') +
        `. ${publication.note}`,
    )
  }

  lines.push('', 'COMPETITOR SITE TRAFFIC, modelled estimates (authored synthetic fixture):')
  for (const row of COMPETITOR_TRAFFIC_FIXTURE.rows) {
    lines.push(
      `- ${row.domain}: ~${row.visits.toLocaleString('en-AU')} visits/mo, ` +
        `${row.pagesPerVisit} pages/visit, bounce ${pct(row.bounceRate)}. ${row.note}`,
    )
  }

  lines.push('', 'OPEN DATASETS (curated references only — nothing ingested):')
  for (const dataset of OPEN_DATASETS_FIXTURE.datasets) {
    lines.push(`- ${dataset.name} (${dataset.publisher}): ${dataset.answers}`)
  }

  return lines.join('\n')
}
