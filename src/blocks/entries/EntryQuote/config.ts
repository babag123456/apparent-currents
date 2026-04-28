import type { Block } from 'payload'

export const EntryQuote: Block = {
  slug: 'entryQuote',
  interfaceName: 'EntryQuoteBlock',
  labels: { singular: 'Quote', plural: 'Quotes' },
  admin: {},
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'author', type: 'text' },
    { name: 'role', type: 'text' },
  ],
}
