import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { sharedEntryBlocks } from '../../blocks/entries/sharedBlocks.ts'

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const anyone = () => true

export const AwardEntries: CollectionConfig = {
  slug: 'award-entries',
  labels: { singular: 'Page', plural: 'Pages' },
  // No-delete (archive-only) model: deletes are only possible via direct Neon SQL,
  // never through the CMS admin, REST, GraphQL, or non-overridden Local API.
  access: { create: authenticated, delete: () => false, read: anyone, update: authenticated },
  versions: { drafts: true },
  admin: {
    // Hide archived pages from the default list view. Editors can still reach them by
    // adding an `archived` filter via the admin Filters UI (used to un-archive).
    baseListFilter: ({ req }) => {
      const rawWhere = JSON.stringify(req?.query?.where ?? {})
      if (rawWhere.includes('archived')) return null
      return { archived: { not_equals: true } }
    },
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
    defaultColumns: ['title', '_status', 'archived', 'category', 'year', 'updatedAt'],
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
      name: 'archived',
      type: 'checkbox',
      label: 'Archived',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Hides this page from the Pages list and disables its public URL (404). The record is retained — it is not deleted.',
      },
    },
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
