import type { Block } from 'payload'

export const EntryGoogleSlidesDeck: Block = {
  slug: 'entryGoogleSlidesDeck',
  interfaceName: 'EntryGoogleSlidesDeckBlock',
  labels: { singular: 'Google Slide Embed', plural: 'Google Slide Embeds' },
  fields: [
    { name: 'prehead', type: 'text', label: 'Client / Prehead' },
    { name: 'headline', type: 'text', label: 'Headline' },
    { name: 'intro', type: 'textarea', label: 'Intro Text' },
    { name: 'title', type: 'text', label: 'Accessible title' },
    {
      name: 'presentation',
      type: 'relationship',
      relationTo: 'presentations' as never,
      required: true,
      label: 'Presentation',
      admin: { description: 'Pick an existing presentation. Its Google Slides deck is embedded here — no separate URL needed.' },
    },
  ],
}
