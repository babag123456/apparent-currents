import type { Block } from 'payload'

export const EntryButton: Block = {
  slug: 'entryButton',
  interfaceName: 'EntryButtonBlock',
  labels: { singular: 'Button', plural: 'Buttons' },
  admin: {},
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { description: 'Full URL including https://, or a relative URL starting with /' },
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'outline',
      options: [
        { label: 'Outline', value: 'outline' },
        { label: 'Text link', value: 'text' },
      ],
    },
  ],
}
