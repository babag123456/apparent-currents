import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getPayload } from 'payload'

import configPromise from '@/payload.config'

const f = createUploadthing()

async function requirePayloadUser(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user) {
    throw new Error('You must be logged in to upload files.')
  }

  return {}
}

export const uploadRouter = {
  mediaUploader: f({ image: { maxFileSize: '64MB' } })
    .middleware(({ req }) => requirePayloadUser(req))
    .onUploadComplete(({ file }) => ({
      key: file.key,
      mimeType: file.type,
      name: file.name,
      size: file.size,
      url: file.ufsUrl,
    })),
  videoUploader: f({ video: { maxFileSize: '128MB' } })
    .middleware(({ req }) => requirePayloadUser(req))
    .onUploadComplete(({ file }) => ({
      key: file.key,
      mimeType: file.type,
      name: file.name,
      size: file.size,
      url: file.ufsUrl,
    })),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
