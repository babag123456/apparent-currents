import type { Block } from 'payload'

export const EntryVideo: Block = {
  slug: 'entryVideo',
  interfaceName: 'EntryVideoBlock',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {},
  fields: [
    { name: 'video', type: 'upload', relationTo: 'media', required: true },
    { name: 'poster', type: 'upload', relationTo: 'media', label: 'Poster Image' },
    { name: 'caption', type: 'text' },
  ],
}
