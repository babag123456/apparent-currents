import type { Block } from 'payload'

export const EntryMedia: Block = {
  slug: 'entryMedia',
  interfaceName: 'EntryMediaBlock',
  labels: { singular: 'Media', plural: 'Media' },
  admin: {},
  fields: [
    { name: 'media', type: 'upload', relationTo: 'media', required: true },
    { name: 'caption', type: 'text' },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default (contained)', value: 'default' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full Bleed', value: 'full' },
      ],
    },
  ],
}
