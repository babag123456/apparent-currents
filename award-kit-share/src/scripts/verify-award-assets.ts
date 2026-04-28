import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

type AssetManifestEntry = {
  legacyId: string
  filename: string
  mimeType: string
  expectedDimensions?: { width?: number | null; height?: number | null } | null
  sourceUrl?: string | null
  recoveredLocalPath: string | null
  checksum: string | null
  usageReferences: string[]
}

type MediaImportDoc = {
  legacyId: string
  filename: string
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const dataDir = path.resolve(dirname, '../data')
const projectRoot = path.resolve(dirname, '../../..')

async function readJson<T>(name: string): Promise<T> {
  const fullPath = path.join(dataDir, name)
  return JSON.parse(await fs.readFile(fullPath, 'utf8')) as T
}

async function checksumFor(fullPath: string) {
  const file = await fs.readFile(fullPath)
  return crypto.createHash('sha256').update(file).digest('hex')
}

async function main() {
  const manifest = await readJson<AssetManifestEntry[]>('asset-manifest.json')
  const mediaDocs = await readJson<MediaImportDoc[]>('media.json')
  const mediaIds = new Set(mediaDocs.map((doc) => doc.legacyId))
  const errors: string[] = []

  for (const asset of manifest) {
    if (!mediaIds.has(asset.legacyId)) {
      errors.push(`Manifest contains unused legacy id ${asset.legacyId}`)
    }

    if (!asset.recoveredLocalPath) {
      errors.push(`Missing recoveredLocalPath for ${asset.filename}`)
      continue
    }

    const fullPath = path.resolve(projectRoot, asset.recoveredLocalPath)
    try {
      await fs.access(fullPath)
    } catch {
      errors.push(`Missing asset file ${asset.recoveredLocalPath}`)
      continue
    }

    const checksum = await checksumFor(fullPath)
    if (!asset.checksum) {
      errors.push(`Missing checksum in manifest for ${asset.filename}`)
      continue
    }

    if (checksum !== asset.checksum) {
      errors.push(`Checksum mismatch for ${asset.filename}`)
    }
  }

  for (const mediaDoc of mediaDocs) {
    if (!manifest.find((asset) => asset.legacyId === mediaDoc.legacyId)) {
      errors.push(`Media document ${mediaDoc.filename} (${mediaDoc.legacyId}) is missing a manifest entry`)
    }
  }

  if (errors.length) {
    for (const error of errors) console.error(`ERROR: ${error}`)
    process.exit(1)
  }

  console.log(`Verified ${manifest.length} award assets`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
