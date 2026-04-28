import type { Block } from 'payload'

export const EntryResults: Block = {
  slug: 'entryResults',
  interfaceName: 'EntryResultsBlock',
  labels: { singular: 'Results', plural: 'Results' },
  admin: {},
  fields: [
    { name: 'intro', type: 'text', label: 'Intro Text', admin: { description: 'Optional heading above results' } },
    {
      name: 'results',
      type: 'array',
      required: true,
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
      maxRows: 8,
    },
  ],
}
