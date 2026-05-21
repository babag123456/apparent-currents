import type { Block } from 'payload'

export const EntryResults: Block = {
  slug: 'entryResults',
  interfaceName: 'EntryResultsBlock',
  labels: { singular: 'Results', plural: 'Results' },
  admin: {},
  fields: [
    { name: 'prehead', type: 'text', label: 'Client / Prehead' },
    { name: 'headline', type: 'text', label: 'Headline' },
    { name: 'intro', type: 'textarea', label: 'Intro Text' },
    {
      name: 'columns',
      type: 'select',
      label: 'Columns',
      defaultValue: '3',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
      ],
    },
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
