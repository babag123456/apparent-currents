import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { loadAwardKitEnv } from '../lib/loadEnv'
import { uploadFilePathToUploadThing } from '../lib/uploadthing'

type MediaDoc = {
  filename?: null | string
  id: number | string
  mimeType?: null | string
  uploadthingKey?: null | string
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mediaDir = path.resolve(dirname, '../../public/award-media')

loadAwardKitEnv()

async function main() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
  })

  let migrated = 0
  let skipped = 0

  for (const rawDoc of result.docs) {
    const doc = rawDoc as unknown as MediaDoc

    if (doc.uploadthingKey) {
      skipped += 1
      continue
    }

    if (!doc.filename) {
      throw new Error(`Media doc ${doc.id} is missing filename and cannot be migrated.`)
    }

    const filePath = path.join(mediaDir, doc.filename)
    await fs.access(filePath)

    const uploaded = await uploadFilePathToUploadThing(filePath, doc.mimeType)

    await payload.update({
      collection: 'media',
      id: doc.id,
      data: {
        uploadthingKey: uploaded.key,
        uploadthingUrl: uploaded.url,
      },
      overrideAccess: true,
    })

    migrated += 1
    console.log(`Migrated media ${doc.id}: ${doc.filename}`)
  }

  console.log(`UploadThing migration complete. Migrated ${migrated}, skipped ${skipped}.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
