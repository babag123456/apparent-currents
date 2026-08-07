/**
 * Seed AUTHORED FIXTURE evidence for the three lenses without live
 * adapters — Conversation (Brandwatch), Behaviour (GA4) and People (GWI) —
 * so every Deep Dive lens is demoable without any vendor connection.
 *
 * Everything here is synthetic and labelled: one sync per lens flagged
 * isFixture, evidence sourceReport 'fixture (authored)', and markers
 * authored alongside the evidence (there is no derivation module for
 * these lenses yet — the markers are part of the authored fixture, not
 * machine output). The sources themselves remain "not connected" in the
 * UI; only the fixture data is shown, stamped synthetic.
 *
 * The story lines up with the demand fixture's topics (charging / range /
 * badge / hedge / challengers) for the Audi · EV Intenders · AU demo.
 *
 * Usage: npx tsx scripts/seed-lens-fixtures.ts [--replace]
 *   --replace deletes previous fixture syncs for these three lenses
 *   (and their evidence/markers) before seeding. Demand fixtures are
 *   untouched — those belong to seed-demand-fixture.ts.
 */
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import type {
  BehaviourEvidence,
  ConversationEvidence,
  Evidence,
  PeopleEvidence,
  TrendSeries,
} from '../src/intelligence/evidence/types.ts'
import type { MarkerRecordInput } from '../src/intelligence/markers/types.ts'
import { evidenceToRecordData, markerToRecordData } from '../src/intelligence/sync/mapping.ts'

const FIXTURE_LENSES = ['conversation', 'behaviour', 'people'] as const
type FixtureLens = (typeof FIXTURE_LENSES)[number]

const SOURCE_BY_LENS: Record<FixtureLens, 'brandwatch' | 'ga4' | 'gwi'> = {
  conversation: 'brandwatch',
  behaviour: 'ga4',
  people: 'gwi',
}

const replace = process.argv.includes('--replace')
const payload = await getPayload({ config })

const contexts = await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
const context = contexts.docs[0]
if (!context) {
  console.error('No contexts exist. Seed one first: npx tsx scripts/seed-demo-context.ts')
  process.exit(1)
}

const priorFixtures = await payload.find({
  collection: 'data-syncs',
  where: {
    context: { equals: context.id },
    lens: { in: FIXTURE_LENSES as unknown as string[] },
    isFixture: { equals: true },
  },
  limit: 30,
})
if (priorFixtures.totalDocs > 0) {
  if (!replace) {
    console.error(
      `Lens fixture sync(s) already exist for context #${context.id}. Re-run with --replace to reseed.`,
    )
    process.exit(1)
  }
  for (const sync of priorFixtures.docs) {
    await payload.delete({
      collection: 'markers',
      where: { sync: { equals: sync.id } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'evidence-records',
      where: { sync: { equals: sync.id } },
      overrideAccess: true,
    })
    await payload.delete({ collection: 'data-syncs', id: sync.id, overrideAccess: true })
  }
  console.log(`Removed ${priorFixtures.totalDocs} prior lens fixture sync(s).`)
}

const retrievedAt = new Date().toISOString()
const market = context.semrushDatabase

function provenance(lens: FixtureLens) {
  return {
    source: SOURCE_BY_LENS[lens],
    sourceReport: 'fixture (authored)',
    retrievedAt,
    market,
    period: 'latest',
  }
}

/* ------------------------------------------------------------------ *
 * Conversation — what people are talking about (Brandwatch shape).
 * Trends are 12 monthly points, oldest first, 0..1 relative.
 * ------------------------------------------------------------------ */

function conversation(
  phrase: string,
  topic: string,
  mentions: number,
  netSentiment: number,
  trend: TrendSeries,
): ConversationEvidence {
  return {
    lens: 'conversation',
    phrase,
    topic,
    provenance: provenance('conversation'),
    metrics: { mentions, netSentiment, trend },
  }
}

const conversationEvidence: ConversationEvidence[] = [
  conversation('public charging reliability', 'charging', 4800, -0.42,
    [0.3, 0.32, 0.35, 0.38, 0.4, 0.45, 0.5, 0.58, 0.65, 0.72, 0.8, 0.85]),
  conversation('home charging setup', 'charging', 2100, 0.31,
    [0.35, 0.36, 0.4, 0.42, 0.45, 0.48, 0.52, 0.56, 0.6, 0.66, 0.7, 0.76]),
  conversation('charging queue etiquette', 'charging', 850, -0.3,
    [0.2, 0.2, 0.24, 0.26, 0.3, 0.32, 0.38, 0.42, 0.5, 0.55, 0.6, 0.68]),
  conversation('ev road trip range', 'range', 1900, -0.08,
    [0.55, 0.56, 0.54, 0.55, 0.57, 0.55, 0.54, 0.56, 0.55, 0.57, 0.56, 0.55]),
  conversation('e-tron ownership stories', 'badge', 950, 0.22,
    [0.7, 0.68, 0.66, 0.64, 0.6, 0.58, 0.55, 0.52, 0.5, 0.48, 0.46, 0.45]),
  conversation('german ev prestige', 'badge', 700, -0.05,
    [0.6, 0.58, 0.57, 0.55, 0.52, 0.5, 0.48, 0.46, 0.44, 0.42, 0.4, 0.39]),
  conversation('phev practicality debate', 'hedge', 1300, 0.18,
    [0.25, 0.26, 0.28, 0.3, 0.34, 0.38, 0.42, 0.46, 0.52, 0.58, 0.62, 0.68]),
  conversation('byd value for money', 'challengers', 2600, 0.35,
    [0.2, 0.22, 0.25, 0.28, 0.32, 0.38, 0.44, 0.52, 0.6, 0.68, 0.76, 0.84]),
]

const conversationMarkers: Array<Omit<MarkerRecordInput, 'sources' | 'derivedAt' | 'market'>> = [
  {
    kind: 'conversation-rising',
    phrase: 'public charging reliability',
    topic: 'charging',
    direction: 'up',
    magnitude: 1.2,
    confidence: 'strong',
    statement:
      'Conversation about public charging reliability is up +120% in the last 3 months vs the preceding baseline.',
    evidence: [{ phrase: 'public charging reliability' }, { phrase: 'charging queue etiquette' }],
  },
  {
    kind: 'sentiment-shifting',
    phrase: 'public charging reliability',
    topic: 'charging',
    direction: 'down',
    magnitude: -0.42,
    confidence: 'moderate',
    statement:
      'Net sentiment on public charging sits at −0.42 while its volume rises — a frustration conversation, not an enthusiasm one.',
    evidence: [{ phrase: 'public charging reliability' }],
  },
  {
    kind: 'conversation-rising',
    phrase: 'phev practicality debate',
    topic: 'hedge',
    direction: 'up',
    magnitude: 0.85,
    confidence: 'moderate',
    statement:
      'PHEV practicality chatter is forming: mention volume is up +85% with mildly positive sentiment.',
    evidence: [{ phrase: 'phev practicality debate' }],
  },
  {
    kind: 'conversation-declining',
    phrase: 'e-tron ownership stories',
    topic: 'badge',
    direction: 'down',
    magnitude: -0.35,
    confidence: 'moderate',
    statement:
      'Owner conversation around e-tron is easing, −35% over the period, even though its sentiment stays positive.',
    evidence: [{ phrase: 'e-tron ownership stories' }, { phrase: 'german ev prestige' }],
  },
  {
    kind: 'conversation-rising',
    phrase: 'byd value for money',
    topic: 'challengers',
    direction: 'up',
    magnitude: 1.4,
    confidence: 'strong',
    statement:
      'Challenger value talk is the fastest-growing conversation in the set: BYD value-for-money mentions are up +140% with clearly positive sentiment.',
    evidence: [{ phrase: 'byd value for money' }],
  },
]

/* ------------------------------------------------------------------ *
 * Behaviour — what people do on owned properties (GA4 shape).
 * ------------------------------------------------------------------ */

function behaviour(
  phrase: string,
  topic: string,
  sessions: number,
  engagementRate: number,
  trend: TrendSeries,
): BehaviourEvidence {
  return {
    lens: 'behaviour',
    phrase,
    topic,
    provenance: provenance('behaviour'),
    metrics: { sessions, engagementRate, trend },
  }
}

const behaviourEvidence: BehaviourEvidence[] = [
  behaviour('/charging/home-charging-guide', 'charging', 21400, 0.61,
    [0.25, 0.28, 0.3, 0.34, 0.38, 0.42, 0.48, 0.55, 0.62, 0.7, 0.78, 0.85]),
  behaviour('/tools/charging-cost-calculator', 'charging', 5200, 0.67,
    [0.2, 0.22, 0.26, 0.3, 0.34, 0.4, 0.46, 0.52, 0.6, 0.66, 0.74, 0.8]),
  behaviour('/charging/public-network-map', 'charging', 9800, 0.55,
    [0.4, 0.42, 0.44, 0.46, 0.5, 0.52, 0.56, 0.6, 0.62, 0.66, 0.7, 0.72]),
  behaviour('/models/q4-e-tron/range', 'range', 15600, 0.49,
    [0.6, 0.61, 0.6, 0.62, 0.6, 0.59, 0.61, 0.6, 0.62, 0.61, 0.6, 0.61]),
  behaviour('/models/e-tron-gt', 'badge', 38200, 0.46,
    [0.85, 0.82, 0.8, 0.78, 0.74, 0.72, 0.7, 0.66, 0.64, 0.62, 0.6, 0.58]),
  behaviour('/offers/phev-range', 'hedge', 6400, 0.58,
    [0.3, 0.3, 0.32, 0.35, 0.38, 0.4, 0.44, 0.46, 0.5, 0.54, 0.58, 0.62]),
  behaviour('/compare/e-tron-vs-competitors', 'challengers', 4100, 0.52,
    [0.3, 0.32, 0.34, 0.36, 0.38, 0.42, 0.44, 0.48, 0.5, 0.54, 0.58, 0.6]),
]

const behaviourMarkers: Array<Omit<MarkerRecordInput, 'sources' | 'derivedAt' | 'market'>> = [
  {
    kind: 'behaviour-rising',
    phrase: '/charging/home-charging-guide',
    topic: 'charging',
    direction: 'up',
    magnitude: 1.4,
    confidence: 'strong',
    statement:
      'Sessions on the home-charging guide are up +140% over the period — the strongest growth on the property.',
    evidence: [
      { phrase: '/charging/home-charging-guide' },
      { phrase: '/tools/charging-cost-calculator' },
    ],
  },
  {
    kind: 'high-engagement',
    phrase: '/tools/charging-cost-calculator',
    topic: 'charging',
    direction: 'flat',
    magnitude: 0.67,
    confidence: 'moderate',
    statement:
      'The charging-cost calculator holds the highest engaged-session share on the property (0.67) — visitors who arrive, work.',
    evidence: [{ phrase: '/tools/charging-cost-calculator' }],
  },
  {
    kind: 'behaviour-declining',
    phrase: '/models/e-tron-gt',
    topic: 'badge',
    direction: 'down',
    magnitude: -0.28,
    confidence: 'strong',
    statement:
      'e-tron GT model-page sessions are easing, −28% over the period, while charging-utility content grows.',
    evidence: [{ phrase: '/models/e-tron-gt' }],
  },
  {
    kind: 'behaviour-rising',
    phrase: '/offers/phev-range',
    topic: 'hedge',
    direction: 'up',
    magnitude: 0.75,
    confidence: 'moderate',
    statement: 'PHEV offer-page sessions are up +75% from a low base.',
    evidence: [{ phrase: '/offers/phev-range' }],
  },
  {
    kind: 'behaviour-rising',
    phrase: '/compare/e-tron-vs-competitors',
    topic: 'challengers',
    direction: 'up',
    magnitude: 0.6,
    confidence: 'moderate',
    statement:
      'Competitor-comparison page sessions are up +60% — visitors are actively weighing alternatives.',
    evidence: [{ phrase: '/compare/e-tron-vs-competitors' }],
  },
]

/* ------------------------------------------------------------------ *
 * People — who the audience is and what they care about (GWI shape).
 * Aggregate attributes only; index 1.0 = national average.
 * ------------------------------------------------------------------ */

function people(
  phrase: string,
  topic: string,
  audienceIndex: number,
  audiencePct: number,
): PeopleEvidence {
  return {
    lens: 'people',
    phrase,
    topic,
    provenance: provenance('people'),
    metrics: { audienceIndex, audiencePct },
  }
}

const peopleEvidence: PeopleEvidence[] = [
  people('worry about public charging availability', 'charging', 1.74, 0.62),
  people('can charge at home (off-street parking)', 'charging', 1.31, 0.58),
  people('range anxiety stops me switching', 'range', 1.22, 0.44),
  people('brand prestige matters to my choice', 'badge', 0.86, 0.29),
  people('consider a plug-in hybrid next', 'hedge', 1.42, 0.37),
  people('would consider a Chinese EV brand', 'challengers', 1.28, 0.41),
  people('sustainability influences my next car choice', 'values', 1.66, 0.71),
]

const peopleMarkers: Array<Omit<MarkerRecordInput, 'sources' | 'derivedAt' | 'market'>> = [
  {
    kind: 'audience-barrier',
    phrase: 'worry about public charging availability',
    topic: 'charging',
    direction: 'flat',
    magnitude: 1.74,
    confidence: 'strong',
    statement:
      '62% of EV intenders worry about public charging availability — 1.7× the national average, the audience’s biggest stated barrier.',
    evidence: [{ phrase: 'worry about public charging availability' }],
  },
  {
    kind: 'audience-over-index',
    phrase: 'consider a plug-in hybrid next',
    topic: 'hedge',
    direction: 'flat',
    magnitude: 1.42,
    confidence: 'strong',
    statement:
      'EV intenders over-index 1.4× on considering a plug-in hybrid next — the hedge instinct shows up in who they are, not just what they search.',
    evidence: [{ phrase: 'consider a plug-in hybrid next' }],
  },
  {
    kind: 'audience-over-index',
    phrase: 'would consider a Chinese EV brand',
    topic: 'challengers',
    direction: 'flat',
    magnitude: 1.28,
    confidence: 'moderate',
    statement:
      '41% of the audience would consider a Chinese EV brand (1.3× the national average) — challenger openness is mainstream, not fringe.',
    evidence: [{ phrase: 'would consider a Chinese EV brand' }],
  },
  {
    kind: 'audience-barrier',
    phrase: 'brand prestige matters to my choice',
    topic: 'badge',
    direction: 'down',
    magnitude: 0.86,
    confidence: 'moderate',
    statement:
      'Brand prestige under-indexes (0.86×) as a purchase driver for this audience — the badge story is weakening at the identity level too.',
    evidence: [{ phrase: 'brand prestige matters to my choice' }],
  },
]

/* ------------------------------------------------------------------ *
 * Seed one fixture sync per lens.
 * ------------------------------------------------------------------ */

const LENS_DATA: Record<
  FixtureLens,
  {
    evidence: Evidence[]
    markers: Array<Omit<MarkerRecordInput, 'sources' | 'derivedAt' | 'market'>>
  }
> = {
  conversation: { evidence: conversationEvidence, markers: conversationMarkers },
  behaviour: { evidence: behaviourEvidence, markers: behaviourMarkers },
  people: { evidence: peopleEvidence, markers: peopleMarkers },
}

for (const lens of FIXTURE_LENSES) {
  const { evidence, markers } = LENS_DATA[lens]
  const source = SOURCE_BY_LENS[lens]

  const sync = await payload.create({
    collection: 'data-syncs',
    overrideAccess: true,
    data: {
      context: context.id,
      lens,
      source,
      status: 'succeeded',
      trigger: 'manual',
      startedAt: retrievedAt,
      finishedAt: retrievedAt,
      requestCount: 0,
      estimatedUnits: 0,
      evidenceCount: evidence.length,
      reports: ['fixture (authored)'],
      isFixture: true,
    },
  })

  const evidenceIdsByPhrase = new Map<string, number>()
  for (const item of evidence) {
    const record = await payload.create({
      collection: 'evidence-records',
      data: evidenceToRecordData(item, context.id, sync.id) as never,
      overrideAccess: true,
    })
    evidenceIdsByPhrase.set(item.phrase, record.id)
  }

  for (const marker of markers) {
    const full: MarkerRecordInput = {
      ...marker,
      market,
      sources: [source],
      derivedAt: retrievedAt,
    }
    await payload.create({
      collection: 'markers',
      data: markerToRecordData(full, context.id, sync.id, evidenceIdsByPhrase) as never,
      overrideAccess: true,
    })
  }

  await payload.update({
    collection: 'data-syncs',
    id: sync.id,
    data: { markerCount: markers.length },
    overrideAccess: true,
  })

  console.log(
    `Seeded ${lens} fixture sync #${sync.id}: ${evidence.length} evidence records, ${markers.length} authored markers (isFixture=true).`,
  )
}

process.exit(0)
