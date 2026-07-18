import type { Block } from 'payload'

import { validateGoogleSlidesUrl } from '../../../lib/presentations/googleSlides.ts'

export const EntryGoogleSlides: Block = {
  slug: 'entryGoogleSlides',
  interfaceName: 'EntryGoogleSlidesBlock',
  labels: { singular: 'Google Slides', plural: 'Google Slides' },
  fields: [
    { name: 'title', type: 'text', label: 'Accessible title' },
    { name: 'slidesUrl', type: 'text', required: true, validate: validateGoogleSlidesUrl },
  ],
}
