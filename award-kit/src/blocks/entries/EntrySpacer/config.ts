import type { Block } from 'payload'

export const EntrySpacer: Block = {
  slug: 'entrySpacer',
  interfaceName: 'EntrySpacerBlock',
  labels: { singular: 'Spacer', plural: 'Spacers' },
  admin: {},
  fields: [
    {
      name: 'size',
      type: 'select',
      defaultValue: 'md',
      required: true,
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
  ],
}
