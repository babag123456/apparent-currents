import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { sharedEntryBlocks } from '../../blocks/entries/sharedBlocks.ts'

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const anyone = () => true

export const AwardEntries: CollectionConfig = {
  slug: 'award-entries',
  labels: { singular: 'Award Entry', plural: 'Award Entries' },
  access: { create: authenticated, delete: authenticated, read: anyone, update: authenticated },
  admin: {
    components: {
      edit: {
        beforeDocumentControls: [
          {
            path: '@/components/payload/AwardEntryGoToPageButton',
            exportName: 'AwardEntryGoToPageButton',
          },
        ],
      },
    },
    defaultColumns: ['title', 'awardBody', 'category', 'year', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'awardBody',
      type: 'text',
      label: 'Award Body',
      admin: { description: 'e.g. Mumbrella, Cannes Lions, B&T' },
    },
    { name: 'category', type: 'text', label: 'Category', admin: { description: 'e.g. Independent Agency of the Year' } },
    { name: 'year', type: 'number', label: 'Year', admin: { position: 'sidebar' } },
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'light',
      label: 'Page Theme',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Content Blocks',
      blocks: sharedEntryBlocks,
    },
    slugField(),
  ],
}
