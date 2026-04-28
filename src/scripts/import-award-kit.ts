import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload, type Payload } from 'payload'
import configPromise from '@payload-config'

import { loadAwardKitEnv } from '../lib/loadEnv'

type AssetManifestEntry = {
  legacyId: string
  filename: string
  recoveredLocalPath: string | null
}

type MediaImportDoc = {
  legacyId: string
  alt?: string | null
  caption?: unknown
  filename: string
}

type AwardEntryImportDoc = {
  legacyId?: string
  title: string
  awardBody?: string | null
  category?: string | null
  year?: number | null
  theme?: 'light' | 'dark' | null
  slug?: string | null
  layout?: Array<Record<string, unknown>>
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const dataDir = path.resolve(dirname, '../data')
const projectRoot = path.resolve(dirname, '../../..')

loadAwardKitEnv()

async function readJson<T>(name: string): Promise<T> {
  const fullPath = path.join(dataDir, name)
  return JSON.parse(await fs.readFile(fullPath, 'utf8')) as T
}

function remapLegacyMedia(blocks: Array<Record<string, unknown>>, mediaIds: Map<string, string>) {
  return blocks.map((block) => {
    const nextBlock = structuredClone(block)

    const remap = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(remap)
      if (!value || typeof value !== 'object') return value

      const record = value as Record<string, unknown>
      const remapped: Record<string, unknown> = {}
      for (const [key, child] of Object.entries(record)) {
        remapped[key] = remap(child)
      }

      if (typeof record.legacyMediaId === 'string') {
        const mediaId = mediaIds.get(record.legacyMediaId)
        if (!mediaId) {
          throw new Error(`Missing remapped media id for legacy media ${record.legacyMediaId}`)
        }
        return mediaId
      }

      return remapped
    }

    return remap(nextBlock) as Record<string, unknown>
  })
}

async function createAward(payload: Payload, awardData: Record<string, unknown>) {
  await payload.create({
    collection: 'awards',
    data: awardData as never,
  })
}

async function createAwardEntry(payload: Payload, entryData: Record<string, unknown>) {
  await payload.create({
    collection: 'award-entries',
    data: entryData as never,
  })
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  const manifest = await readJson<AssetManifestEntry[]>('asset-manifest.json')
  const mediaDocs = await readJson<MediaImportDoc[]>('media.json')
  const awardEntries = await readJson<AwardEntryImportDoc[]>('award-entries.json')
  const awards = await readJson<Array<Record<string, unknown>>>('awards.json')

  const assetMap = new Map(manifest.map((asset) => [asset.legacyId, asset]))
  const mediaIdMap = new Map<string, string>()

  for (const mediaDoc of mediaDocs) {
    const asset = assetMap.get(mediaDoc.legacyId)
    if (!asset?.recoveredLocalPath) {
      throw new Error(`Asset ${mediaDoc.filename} (${mediaDoc.legacyId}) has not been recovered`)
    }

    const filePath = path.resolve(projectRoot, asset.recoveredLocalPath)

    const created = await payload.create({
      collection: 'media',
      data: {
        alt: mediaDoc.alt ?? undefined,
        caption: mediaDoc.caption as never,
      },
      filePath,
    })

    mediaIdMap.set(mediaDoc.legacyId, String(created.id))
  }

  for (const entry of awardEntries) {
    const { legacyId, ...entryData } = entry
    void legacyId
    const layout = remapLegacyMedia(entry.layout ?? [], mediaIdMap)
    await createAwardEntry(payload, {
      title: entryData.title,
      awardBody: entryData.awardBody ?? undefined,
      category: entryData.category ?? undefined,
      year: entryData.year ?? undefined,
      theme: entryData.theme ?? 'light',
      slug: entryData.slug ?? undefined,
      layout,
    })
  }

  for (const award of awards) {
    const { legacyId, ...awardData } = award as { legacyId?: string } & Record<string, unknown>
    void legacyId
    await createAward(payload, awardData)
  }

  console.log(
    `Imported ${mediaIdMap.size} media, ${awardEntries.length} award entries, and ${awards.length} awards`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
