import type { Block } from 'payload'

export const EntryVideo: Block = {
  slug: 'entryVideo',
  interfaceName: 'EntryVideoBlock',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {},
  fields: [
    {
      name: 'source',
      type: 'select',
      defaultValue: 'upload',
      required: true,
      options: [
        { label: 'Uploaded Video', value: 'upload' },
        { label: 'Vimeo URL', value: 'vimeo' },
      ],
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'videos',
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'upload',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Vimeo URL',
      admin: {
        condition: (_data, siblingData) => siblingData?.source === 'vimeo',
        placeholder: 'https://vimeo.com/123456789',
      },
    },
    { name: 'poster', type: 'upload', relationTo: 'media', label: 'Poster Image' },
    { name: 'caption', type: 'text' },
  ],
}
