import type { Block } from 'payload'

export const EntryImageGrid: Block = {
  slug: 'entryImageGrid',
  interfaceName: 'EntryImageGridBlock',
  labels: { singular: 'Image Grid', plural: 'Image Grids' },
  admin: {},
  fields: [
    {
      name: 'images',
      type: 'array',
      required: true,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
      maxRows: 8,
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: '2 Column', value: '2' },
        { label: '3 Column', value: '3' },
      ],
    },
  ],
}
