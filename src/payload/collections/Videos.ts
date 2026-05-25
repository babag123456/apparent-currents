import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionBeforeReadHook,
  CollectionConfig,
  TypeWithID,
} from 'payload'

import { createMuxAssetFromUrl, deleteMuxAsset, getMuxPlaybackUrl, getMuxThumbnailUrl } from '../../lib/mux.ts'
import {
  deleteUploadThingFile,
  fetchDirectUploadThingFile,
  getDirectUploadThingContext,
  readPayloadUploadBuffer,
  uploadBufferToUploadThing,
} from '../../lib/uploadthing.ts'
import { getDirectUploadLimitMB, limitUploadSize } from '../../lib/uploadLimits.ts'
import { fieldAuthenticated, isAuthenticated } from '../../lib/security/access.ts'

const anyone = () => true
const directUploadLimitMB = getDirectUploadLimitMB()

type VideoDoc = TypeWithID & {
  _muxPlaybackId?: null | string
  _sourceUploadthingUrl?: null | string
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
    const directUpload = getDirectUploadThingContext(req.file)

    if (directUpload) {
      sourceUpload = {
        key: directUpload.key,
        url: directUpload.url,
      }
    } else {
      const buffer = await readPayloadUploadBuffer(req.file)
      sourceUpload = await uploadBufferToUploadThing({
        buffer,
        filename: req.file.name,
        mimeType: req.file.mimetype,
      })
    }

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

const preserveVideoHostingFields: CollectionBeforeReadHook<VideoDoc> = async ({ doc }) => {
  doc._muxPlaybackId = doc.muxPlaybackId
  doc._sourceUploadthingUrl = doc.sourceUploadthingUrl

  return doc
}

const hydrateMuxUrls: CollectionAfterReadHook<VideoDoc> = async ({ doc, req }) => {
  const muxPlaybackId = doc.muxPlaybackId || doc._muxPlaybackId
  const sourceUploadthingUrl = doc.sourceUploadthingUrl || doc._sourceUploadthingUrl
  const muxPlaybackUrl = getMuxPlaybackUrl(muxPlaybackId)

  doc.url = muxPlaybackUrl || (req.user ? sourceUploadthingUrl || doc.url : null)
  doc.thumbnailUrl = getMuxThumbnailUrl(muxPlaybackId)
  delete doc._muxPlaybackId
  delete doc._sourceUploadthingUrl

  return doc
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: anyone,
    update: isAuthenticated,
  },
  admin: {
    defaultColumns: ['filename', 'updatedAt'],
  },
  hooks: {
    beforeChange: [
      ...(directUploadLimitMB
        ? [
            limitUploadSize<VideoDoc>({
              collectionLabel: 'Video',
              limitMB: directUploadLimitMB,
              skipClientUpload: true,
            }),
          ]
        : []),
      limitUploadSize<VideoDoc>({ collectionLabel: 'Video', limitMB: 100 }),
      syncVideoHosting,
    ],
    afterChange: [cleanupReplacedVideoHosting],
    afterDelete: [removeDeletedVideoHosting],
    afterRead: [hydrateMuxUrls],
    beforeRead: [preserveVideoHostingFields],
  },
  fields: [
    {
      name: 'sourceUploadthingKey',
      type: 'text',
      access: {
        create: fieldAuthenticated,
        read: fieldAuthenticated,
        update: fieldAuthenticated,
      },
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'sourceUploadthingUrl',
      type: 'text',
      access: {
        create: fieldAuthenticated,
        read: fieldAuthenticated,
        update: fieldAuthenticated,
      },
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'muxAssetId',
      type: 'text',
      access: {
        create: fieldAuthenticated,
        read: fieldAuthenticated,
        update: fieldAuthenticated,
      },
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'muxPlaybackId',
      type: 'text',
      access: {
        create: fieldAuthenticated,
        read: fieldAuthenticated,
        update: fieldAuthenticated,
      },
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'muxStatus',
      type: 'text',
      access: {
        create: fieldAuthenticated,
        read: fieldAuthenticated,
        update: fieldAuthenticated,
      },
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
    handlers: [
      async (_req, { params }): Promise<Response> => {
        const directUpload = getDirectUploadThingContext({
          clientUploadContext: params.clientUploadContext,
        })

        if (!directUpload) {
          throw new Error('Missing direct upload metadata for video upload.')
        }

        return fetchDirectUploadThingFile(directUpload)
      },
    ],
    mimeTypes: ['video/*'],
  },
}
