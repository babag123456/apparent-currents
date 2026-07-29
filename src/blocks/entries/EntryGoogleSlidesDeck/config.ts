import type { Block } from 'payload'

import { validateGoogleSlidesUrl } from '../../../lib/presentations/googleSlides.ts'

export const EntryGoogleSlidesDeck: Block = {
  slug: 'entryGoogleSlidesDeck',
  interfaceName: 'EntryGoogleSlidesDeckBlock',
  labels: { singular: 'Google Slides Deck', plural: 'Google Slides Decks' },
  fields: [
    { name: 'prehead', type: 'text', label: 'Client / Prehead' },
    { name: 'headline', type: 'text', label: 'Headline' },
    { name: 'intro', type: 'textarea', label: 'Intro Text' },
    { name: 'title', type: 'text', label: 'Accessible title' },
    {
      name: 'linkedPresentation',
      type: 'relationship',
      relationTo: 'presentations' as never,
      label: 'Linked presentation page',
      admin: { description: 'Optional. Links this module to a presentation page; shows an “Open presentation” button and keeps the two connected for reporting.' },
    },
    {
      name: 'slidesUrl',
      type: 'text',
      required: true,
      validate: validateGoogleSlidesUrl,
      admin: { description: 'Editable sharing URL (https://docs.google.com/presentation/d/…). Share the deck with the service-account email.' },
    },
    {
      name: 'forceSlidesSync',
      type: 'checkbox',
      label: 'Force re-sync on next save',
      admin: { description: 'Tick and save to pull the latest slides even if the URL is unchanged.' },
    },
    {
      name: 'syncedSlides',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'objectId', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'imageUrl', type: 'text', required: true },
        { name: 'imageKey', type: 'text', required: true },
        { name: 'width', type: 'number', required: true },
        { name: 'height', type: 'number', required: true },
      ],
    },
    { name: 'slidesSyncedAt', type: 'date', admin: { hidden: true, readOnly: true } },
    { name: 'slidesSyncError', type: 'text', admin: { hidden: true, readOnly: true } },
  ],
}
