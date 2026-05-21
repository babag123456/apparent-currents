import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  TypeWithID,
} from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import {
  deleteUploadThingFile,
  fetchDirectUploadThingFile,
  getDirectUploadThingContext,
  readPayloadUploadBuffer,
  uploadBufferToUploadThing,
} from '../../lib/uploadthing.ts'
import { getDirectUploadLimitMB, limitUploadSize } from '../../lib/uploadLimits.ts'

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const anyone = () => true
const directUploadLimitMB = getDirectUploadLimitMB()

type MediaDoc = TypeWithID & {
  uploadthingKey?: null | string
  uploadthingUrl?: null | string
  url?: null | string
}

const syncUploadThingMedia: CollectionBeforeChangeHook<MediaDoc> = async ({ data, req }) => {
  if (!req.file) return data

  const directUpload = getDirectUploadThingContext(req.file)

  if (directUpload) {
    return {
      ...data,
      uploadthingKey: directUpload.key,
      uploadthingUrl: directUpload.url,
    }
  }

  const buffer = await readPayloadUploadBuffer(req.file)
  const uploaded = await uploadBufferToUploadThing({
    buffer,
    filename: req.file.name,
    mimeType: req.file.mimetype,
  })

  return {
    ...data,
    uploadthingKey: uploaded.key,
    uploadthingUrl: uploaded.url,
  }
}

const cleanupReplacedUploadThingMedia: CollectionAfterChangeHook<MediaDoc> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (!req.file) return doc

  if (previousDoc.uploadthingKey && previousDoc.uploadthingKey !== doc.uploadthingKey) {
    await deleteUploadThingFile(previousDoc.uploadthingKey)
  }

  return doc
}

const removeDeletedUploadThingMedia: CollectionAfterDeleteHook<MediaDoc> = async ({ doc }) => {
  await deleteUploadThingFile(doc.uploadthingKey)
}

const hydrateUploadThingUrl: CollectionAfterReadHook<MediaDoc> = async ({ doc }) => {
  if (doc.uploadthingUrl) {
    doc.url = doc.uploadthingUrl
  }

  return doc
}

export const Media: CollectionConfig = {
  slug: 'media',
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
    beforeChange: [
      ...(directUploadLimitMB
        ? [
            limitUploadSize<MediaDoc>({
              collectionLabel: 'Media',
              limitMB: directUploadLimitMB,
              skipClientUpload: true,
            }),
          ]
        : []),
      limitUploadSize<MediaDoc>({ collectionLabel: 'Media', limitMB: 50 }),
      syncUploadThingMedia,
    ],
    afterChange: [cleanupReplacedUploadThingMedia],
    afterDelete: [removeDeletedUploadThingMedia],
    afterRead: [hydrateUploadThingUrl],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()],
      }),
    },
    {
      name: 'uploadthingKey',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'uploadthingUrl',
      type: 'text',
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
  ],
  upload: {
    adminThumbnail: ({ doc }) =>
      typeof doc.uploadthingUrl === 'string' ? doc.uploadthingUrl : typeof doc.url === 'string' ? doc.url : null,
    disableLocalStorage: true,
    displayPreview: true,
    focalPoint: true,
    handlers: [
      async (_req, { params }): Promise<Response> => {
        const directUpload = getDirectUploadThingContext({
          clientUploadContext: params.clientUploadContext,
        })

        if (!directUpload) {
          throw new Error('Missing direct upload metadata for media upload.')
        }

        return fetchDirectUploadThingFile(directUpload)
      },
    ],
    imageSizes: [{ name: 'thumbnail', width: 600, fit: 'cover' }],
    mimeTypes: ['image/*'],
  },
}
