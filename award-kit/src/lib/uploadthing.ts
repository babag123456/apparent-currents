import fs from 'fs/promises'
import mime from 'mime-types'
import path from 'path'
import { UTApi, UTFile } from 'uploadthing/server'

import { loadAwardKitEnv } from './loadEnv'

loadAwardKitEnv()

export type UploadThingUpload = {
  key: string
  url: string
}

type UploadBufferArgs = {
  buffer: Buffer
  filename: string
  mimeType?: string | null
}

function getUploadThingToken() {
  return process.env.UPLOADTHING_TOKEN || process.env.ASSET_HOSTING_API_KEY || ''
}

function getUploadThingClient() {
  const token = getUploadThingToken()
  if (!token) {
    throw new Error('Missing UploadThing token. Set UPLOADTHING_TOKEN or ASSET_HOSTING_API_KEY.')
  }

  return new UTApi({ token })
}

function inferMimeType(filename: string, mimeType?: string | null) {
  if (mimeType) return mimeType
  return mime.lookup(filename) || 'application/octet-stream'
}

export async function readPayloadUploadBuffer(file: {
  data: Buffer
  tempFilePath?: string
}) {
  if (file.data.length > 0) return file.data
  if (file.tempFilePath) return fs.readFile(file.tempFilePath)

  throw new Error('Upload file buffer is empty and no tempFilePath was provided.')
}

export async function uploadBufferToUploadThing({
  buffer,
  filename,
  mimeType,
}: UploadBufferArgs): Promise<UploadThingUpload> {
  const utapi = getUploadThingClient()
  const result = await utapi.uploadFiles(
    new UTFile([new Uint8Array(buffer)], path.basename(filename), {
      type: inferMimeType(filename, mimeType),
    }),
    {
      acl: 'public-read',
      contentDisposition: 'inline',
    },
  )

  if (result.error || !result.data) {
    throw new Error(result.error?.message || `UploadThing upload failed for ${filename}`)
  }

  return {
    key: result.data.key,
    url: result.data.ufsUrl,
  }
}

export async function uploadFilePathToUploadThing(filePath: string, mimeType?: string | null) {
  const buffer = await fs.readFile(filePath)
  return uploadBufferToUploadThing({
    buffer,
    filename: path.basename(filePath),
    mimeType,
  })
}

export async function deleteUploadThingFile(fileKey?: null | string) {
  if (!fileKey) return

  const utapi = getUploadThingClient()
  await utapi.deleteFiles(fileKey)
}
