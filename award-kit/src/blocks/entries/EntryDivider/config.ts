import type { Block } from 'payload'

export const EntryDivider: Block = {
  slug: 'entryDivider',
  interfaceName: 'EntryDividerBlock',
  labels: { singular: 'Divider', plural: 'Dividers' },
  admin: {},
  fields: [
    {
      name: 'color',
      type: 'select',
      defaultValue: 'subtle',
      options: [
        { label: 'Subtle', value: 'subtle' },
        { label: 'Red', value: 'red' },
        { label: 'Charcoal', value: 'charcoal' },
      ],
    },
  ],
}
