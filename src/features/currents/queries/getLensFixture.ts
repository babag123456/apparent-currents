import { getPayload } from 'payload'

import config from '@payload-config'

/**
 * Load the latest successful sync (and its evidence + markers) for one of
 * the fixture-only lenses — conversation, behaviour, people. These lenses
 * have no live adapters: any data returned here entered via
 * seed-lens-fixtures.ts and carries isFixture on its sync, which the
 * pages surface as SYNTHETIC FIXTURE stamps.
 */
export async function getLensFixture(lens: 'conversation' | 'behaviour' | 'people') {
  let payload
  try {
    payload = await getPayload({ config })
  } catch {
    return null
  }

  const context = (
    await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
  ).docs[0]
  if (!context) return null

  const sync = (
    await payload.find({
      collection: 'data-syncs',
      where: {
        context: { equals: context.id },
        lens: { equals: lens },
        status: { equals: 'succeeded' },
      },
      sort: '-finishedAt',
      limit: 1,
    })
  ).docs[0]
  if (!sync || !sync.finishedAt) return { context, sync: null, evidence: [], markers: [] }

  const [evidence, markers] = await Promise.all([
    payload.find({
      collection: 'evidence-records',
      where: { sync: { equals: sync.id } },
      sort: 'phrase',
      limit: 60,
    }),
    payload.find({
      collection: 'markers',
      where: { sync: { equals: sync.id } },
      sort: '-magnitude',
      limit: 60,
    }),
  ])

  return { context, sync, evidence: evidence.docs, markers: markers.docs }
}

export type LensFixtureData = NonNullable<Awaited<ReturnType<typeof getLensFixture>>>
