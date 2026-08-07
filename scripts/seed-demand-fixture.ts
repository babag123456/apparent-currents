/**
 * Seed AUTHORED FIXTURE demand evidence for the demo context so the whole
 * marker → current → Surface path is designable without spending API
 * units. The evidence is synthetic; the markers are genuinely derived
 * from it by the real derivation module; the sync record is flagged
 * isFixture and the UI labels everything from it as synthetic.
 *
 * Usage: npx tsx scripts/seed-demand-fixture.ts [--replace]
 *   --replace deletes a previous fixture sync (and its evidence/markers)
 *   for the context before seeding.
 */
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import type { DemandEvidence, TrendSeries } from '../src/intelligence/evidence/types.ts'
import { deriveDemandMarkers } from '../src/intelligence/markers/deriveDemandMarkers.ts'
import {
  evidenceToRecordData,
  markerToRecordData,
} from '../src/intelligence/sync/mapping.ts'

const replace = process.argv.includes('--replace')
const payload = await getPayload({ config })

const contexts = await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
const context = contexts.docs[0]
if (!context) {
  console.error('No contexts exist. Seed one first: npx tsx scripts/seed-demo-context.ts')
  process.exit(1)
}

const priorFixture = await payload.find({
  collection: 'data-syncs',
  where: { context: { equals: context.id }, isFixture: { equals: true } },
  limit: 10,
})
if (priorFixture.totalDocs > 0) {
  if (!replace) {
    console.error(
      `A fixture sync already exists for context #${context.id}. Re-run with --replace to reseed.`,
    )
    process.exit(1)
  }
  for (const sync of priorFixture.docs) {
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
  console.log(`Removed ${priorFixture.totalDocs} prior fixture sync(s).`)
}

const retrievedAt = new Date().toISOString()

function fixtureEvidence(
  phrase: string,
  topic: string,
  searchVolume: number,
  trend: TrendSeries,
  intents: DemandEvidence['intents'],
): DemandEvidence {
  return {
    lens: 'demand',
    phrase,
    topic,
    provenance: {
      source: 'semrush',
      sourceReport: 'fixture (authored)',
      retrievedAt,
      market: context.semrushDatabase,
      period: 'latest',
    },
    metrics: { searchVolume, trend },
    intents,
  }
}

/* Authored to production plausibility for the Audi · EV Intenders · AU
 * story. Trends are 12 monthly points, oldest first, 0..1 relative. */
const evidence: DemandEvidence[] = [
  // Charging — the accelerating cluster
  fixtureEvidence('ev charging', 'charging', 22400,
    [0.5, 0.52, 0.55, 0.55, 0.58, 0.6, 0.6, 0.62, 0.68, 0.72, 0.75, 0.78],
    ['informational', 'commercial']),
  fixtureEvidence('home ev charger', 'charging', 4400,
    [0.35, 0.36, 0.38, 0.4, 0.42, 0.44, 0.46, 0.5, 0.56, 0.62, 0.7, 0.78],
    ['commercial']),
  fixtureEvidence('home ev charger installation cost', 'charging', 1900,
    [0.2, 0.22, 0.24, 0.25, 0.28, 0.3, 0.33, 0.38, 0.45, 0.55, 0.62, 0.72],
    ['commercial', 'transactional']),
  fixtureEvidence('ev charger rebate nsw', 'charging', 880,
    [0.1, 0.1, 0.12, 0.14, 0.15, 0.18, 0.22, 0.28, 0.35, 0.45, 0.55, 0.65],
    ['informational']),
  fixtureEvidence('ev charging stations near me', 'charging', 12100,
    [0.6, 0.6, 0.62, 0.62, 0.64, 0.65, 0.65, 0.66, 0.68, 0.7, 0.7, 0.72],
    ['navigational']),
  // Range — the established plateau
  fixtureEvidence('electric car range', 'range', 5400,
    [0.7, 0.71, 0.69, 0.7, 0.72, 0.7, 0.69, 0.71, 0.7, 0.72, 0.7, 0.71],
    ['informational']),
  fixtureEvidence('ev range australia', 'range', 5400,
    [0.68, 0.7, 0.69, 0.7, 0.71, 0.7, 0.7, 0.69, 0.7, 0.71, 0.7, 0.7],
    ['informational']),
  fixtureEvidence('ev range anxiety', 'range', 720,
    [0.5, 0.5, 0.49, 0.5, 0.48, 0.49, 0.48, 0.47, 0.47, 0.46, 0.46, 0.45],
    ['informational']),
  // Badge — the declining set
  fixtureEvidence('audi e-tron', 'badge', 14800,
    [0.8, 0.78, 0.76, 0.75, 0.72, 0.7, 0.68, 0.66, 0.6, 0.55, 0.5, 0.48],
    ['commercial', 'navigational']),
  fixtureEvidence('audi e-tron price', 'badge', 2900,
    [0.7, 0.69, 0.68, 0.66, 0.64, 0.62, 0.6, 0.57, 0.53, 0.5, 0.47, 0.44],
    ['commercial', 'transactional']),
  fixtureEvidence('luxury electric car', 'badge', 1600,
    [0.6, 0.59, 0.58, 0.57, 0.56, 0.54, 0.52, 0.5, 0.46, 0.43, 0.41, 0.39],
    ['commercial']),
  // Hedge — plug-in interest re-forming
  fixtureEvidence('phev vs ev', 'hedge', 1300,
    [0.25, 0.26, 0.28, 0.3, 0.3, 0.32, 0.35, 0.4, 0.46, 0.52, 0.58, 0.64],
    ['informational', 'commercial']),
  fixtureEvidence('audi phev', 'hedge', 640,
    [0.15, 0.16, 0.16, 0.18, 0.2, 0.22, 0.25, 0.28, 0.32, 0.36, 0.4, 0.44],
    ['commercial']),
  // Challengers — small, forming
  fixtureEvidence('byd vs audi', 'challengers', 90,
    [0.08, 0.08, 0.1, 0.1, 0.12, 0.14, 0.16, 0.2, 0.26, 0.3, 0.36, 0.44],
    ['commercial']),
]

const sync = await payload.create({
  collection: 'data-syncs',
  overrideAccess: true,
  data: {
    context: context.id,
    lens: 'demand',
    source: 'semrush',
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

const markers = deriveDemandMarkers(evidence)
for (const marker of markers) {
  await payload.create({
    collection: 'markers',
    data: markerToRecordData(marker, context.id, sync.id, evidenceIdsByPhrase) as never,
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
  `Seeded fixture sync #${sync.id}: ${evidence.length} evidence records, ${markers.length} derived markers (isFixture=true).`,
)
process.exit(0)
