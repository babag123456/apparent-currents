import type { Block } from 'payload'

export const EntryHero: Block = {
  slug: 'entryHero',
  interfaceName: 'EntryHeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  admin: {},
  fields: [
    { name: 'prehead', type: 'text', admin: { description: 'Small text above headline (e.g. award body + year)' } },
    { name: 'headline', type: 'text', required: true },
    { name: 'subhead', type: 'text' },
    { name: 'media', type: 'upload', relationTo: 'media', label: 'Hero Image / GIF' },
    {
      name: 'mediaPosition',
      type: 'select',
      defaultValue: 'below',
      label: 'Image Position',
      options: [
        { label: 'Below text', value: 'below' },
        { label: 'Behind text (overlay)', value: 'behind' },
        { label: 'Above text', value: 'above' },
      ],
      admin: {
        condition: (_, { media } = {}) => !!media,
        description: '"Behind" adds a dark overlay so text stays readable',
      },
    },
    {
      name: 'heroHeight',
      type: 'select',
      defaultValue: 'standard',
      label: 'Hero Height',
      options: [
        { label: 'Compact', value: 'compact' },
        { label: 'Standard', value: 'standard' },
        { label: 'Tall', value: 'tall' },
        { label: 'Full Screen', value: 'full' },
      ],
      admin: {
        condition: (_, { mediaPosition } = {}) => mediaPosition === 'behind',
        description: 'Controls how much of the background image is visible',
      },
    },
    {
      name: 'mediaWidth',
      type: 'select',
      defaultValue: 'wide',
      label: 'Image Width',
      options: [
        { label: 'Contained (match text)', value: 'contained' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full Bleed', value: 'full' },
      ],
      admin: {
        condition: (_, { media, mediaPosition } = {}) => !!media && mediaPosition !== 'behind',
        description: 'Width of the image when above or below text',
      },
    },
    {
      name: 'textAlign',
      type: 'select',
      defaultValue: 'center',
      label: 'Text Alignment',
      options: [
        { label: 'Centre', value: 'center' },
        { label: 'Left', value: 'left' },
      ],
    },
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Light (cream bg)', value: 'light' },
        { label: 'Dark (charcoal bg)', value: 'dark' },
        { label: 'Plum', value: 'plum' },
      ],
      admin: {
        condition: (_, { mediaPosition } = {}) => mediaPosition !== 'behind',
        description: 'Ignored when image is behind (text forced to cream)',
      },
    },
  ],
}
