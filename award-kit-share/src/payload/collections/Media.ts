import path from 'path'
import { fileURLToPath } from 'url'
import type { CollectionConfig } from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const anyone = () => true

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
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../../public/award-media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [{ name: 'thumbnail', width: 600, fit: 'cover' }],
  },
}
