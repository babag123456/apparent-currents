import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  TypeWithID,
} from 'payload'

import { createMuxAssetFromUrl, deleteMuxAsset, getMuxPlaybackUrl, getMuxThumbnailUrl } from '../../lib/mux'
import {
  deleteUploadThingFile,
  readPayloadUploadBuffer,
  uploadBufferToUploadThing,
} from '../../lib/uploadthing'

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const anyone = () => true

type VideoDoc = TypeWithID & {
  muxAssetId?: null | string
  muxPlaybackId?: null | string
  muxStatus?: null | string
  sourceUploadthingKey?: null | string
  sourceUploadthingUrl?: null | string
  thumbnailUrl?: null | string
  url?: null | string
}

const syncVideoHosting: CollectionBeforeChangeHook<VideoDoc> = async ({ data, req }) => {
  if (!req.file) return data

  let sourceUpload: null | { key: string; url: string } = null

  try {
    const buffer = await readPayloadUploadBuffer(req.file)
    sourceUpload = await uploadBufferToUploadThing({
      buffer,
      filename: req.file.name,
      mimeType: req.file.mimetype,
    })

    const muxAsset = await createMuxAssetFromUrl(sourceUpload.url)

    return {
      ...data,
      sourceUploadthingKey: sourceUpload.key,
      sourceUploadthingUrl: sourceUpload.url,
      muxAssetId: muxAsset.assetId,
      muxPlaybackId: muxAsset.playbackId,
      muxStatus: muxAsset.status,
    }
  } catch (error) {
    console.error('Video hosting sync failed during video upload.', {
      filename: req.file.name,
      error,
    })

    if (sourceUpload?.key) {
      await deleteUploadThingFile(sourceUpload.key)
    }

    throw error
  }
}

const cleanupReplacedVideoHosting: CollectionAfterChangeHook<VideoDoc> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (!req.file) return doc

  if (previousDoc.sourceUploadthingKey && previousDoc.sourceUploadthingKey !== doc.sourceUploadthingKey) {
    await deleteUploadThingFile(previousDoc.sourceUploadthingKey)
  }

  if (previousDoc.muxAssetId && previousDoc.muxAssetId !== doc.muxAssetId) {
    await deleteMuxAsset(previousDoc.muxAssetId)
  }

  return doc
}

const removeDeletedVideoHosting: CollectionAfterDeleteHook<VideoDoc> = async ({ doc }) => {
  await Promise.all([
    deleteUploadThingFile(doc.sourceUploadthingKey),
    deleteMuxAsset(doc.muxAssetId),
  ])
}

const hydrateMuxUrls: CollectionAfterReadHook<VideoDoc> = async ({ doc }) => {
  doc.url = getMuxPlaybackUrl(doc.muxPlaybackId) || doc.sourceUploadthingUrl || doc.url
  doc.thumbnailUrl = getMuxThumbnailUrl(doc.muxPlaybackId)

  return doc
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['filename', 'updatedAt'],
  },
  hooks: {
    beforeChange: [syncVideoHosting],
    afterChange: [cleanupReplacedVideoHosting],
    afterDelete: [removeDeletedVideoHosting],
    afterRead: [hydrateMuxUrls],
  },
  fields: [
    {
      name: 'sourceUploadthingKey',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'sourceUploadthingUrl',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'muxAssetId',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'muxPlaybackId',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'muxStatus',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ],
  upload: {
    adminThumbnail: ({ doc }) =>
      typeof doc.thumbnailUrl === 'string' ? doc.thumbnailUrl : false,
    disableLocalStorage: true,
    displayPreview: false,
    mimeTypes: ['video/*'],
  },
}
