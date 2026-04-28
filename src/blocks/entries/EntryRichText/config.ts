import type { Block } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const EntryRichText: Block = {
  slug: 'entryRichText',
  interfaceName: 'EntryRichTextBlock',
  labels: { singular: 'Rich Text', plural: 'Rich Text' },
  admin: {},
  fields: [
    {
      name: 'richText',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'maxWidth',
      type: 'select',
      defaultValue: 'narrow',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Full', value: 'full' },
      ],
    },
  ],
}
