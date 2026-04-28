import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { EntryHero } from '../../blocks/entries/EntryHero/config'
import { EntryCaseStudy } from '../../blocks/entries/EntryCaseStudy/config'
import { EntryRichText } from '../../blocks/entries/EntryRichText/config'
import { EntryMedia } from '../../blocks/entries/EntryMedia/config'
import { EntryResults } from '../../blocks/entries/EntryResults/config'
import { EntryQuote } from '../../blocks/entries/EntryQuote/config'
import { EntryImageGrid } from '../../blocks/entries/EntryImageGrid/config'
import { EntryVideo } from '../../blocks/entries/EntryVideo/config'
import { EntrySpacer } from '../../blocks/entries/EntrySpacer/config'
import { EntryDivider } from '../../blocks/entries/EntryDivider/config'

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const anyone = () => true

export const AwardEntries: CollectionConfig = {
  slug: 'award-entries',
  labels: { singular: 'Award Entry', plural: 'Award Entries' },
  access: { create: authenticated, delete: authenticated, read: anyone, update: authenticated },
  admin: {
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
      blocks: [
        EntryHero,
        EntryCaseStudy,
        EntryRichText,
        EntryMedia,
        EntryResults,
        EntryQuote,
        EntryImageGrid,
        EntryVideo,
        EntrySpacer,
        EntryDivider,
      ],
    },
    slugField(),
  ],
}
