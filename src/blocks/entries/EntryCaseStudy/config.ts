import type { Block } from 'payload'

import { validatePublicHref } from '../../../lib/security/url'

export const EntryCaseStudy: Block = {
  slug: 'entryCaseStudy',
  interfaceName: 'EntryCaseStudyBlock',
  labels: { singular: 'Case Study Section', plural: 'Case Study Sections' },
  admin: {},
  fields: [
    { name: 'client', type: 'text', label: 'Client / Prehead' },
    { name: 'headline', type: 'text', required: true },
    { name: 'body', type: 'textarea', label: 'Body Copy' },
    {
      name: 'resultColumns',
      type: 'select',
      label: 'Result Columns',
      defaultValue: '3',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
      ],
    },
    {
      name: 'results',
      type: 'array',
      label: 'Key Results',
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. 75.8%, $233M, 25.2%' } },
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. form completion rate' } },
      ],
      maxRows: 6,
    },
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      fields: [
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. View live site, Read case study' } },
        { name: 'url', type: 'text', required: true, validate: validatePublicHref, admin: { description: 'Full URL including https://' } },
        {
          name: 'style',
          type: 'select',
          defaultValue: 'outline',
          options: [
            { label: 'Outline', value: 'outline' },
            { label: 'Text link', value: 'text' },
          ],
        },
      ],
      maxRows: 4,
    },
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
      ],
      maxRows: 6,
    },
    {
      name: 'imageLayout',
      type: 'select',
      defaultValue: 'auto',
      label: 'Image Layout',
      options: [
        { label: 'Auto (based on count)', value: 'auto' },
        { label: '2 Column', value: '2-col' },
        { label: '3 Column', value: '3-col' },
        { label: 'Full Width Stack', value: 'stack' },
      ],
    },
  ],
}
