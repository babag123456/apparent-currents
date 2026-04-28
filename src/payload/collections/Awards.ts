import type { CollectionConfig } from 'payload'

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const anyone = () => true

export const Awards: CollectionConfig = {
  slug: 'awards',
  access: { create: authenticated, delete: authenticated, read: anyone, update: authenticated },
  admin: { defaultColumns: ['title', 'awardBody', 'year', 'result'], useAsTitle: 'title' },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Campaign or work title the award is for' },
    },
    {
      name: 'awardBody',
      type: 'text',
      required: true,
      label: 'Award Body',
      admin: { description: 'e.g. Campaign Asia Awards, B&T Awards' },
    },
    {
      name: 'category',
      type: 'text',
      admin: { description: 'e.g. Agency of the Year, Campaign of the Year' },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'result',
      type: 'select',
      required: true,
      options: [
        { label: 'Won', value: 'won' },
        { label: 'Finalist', value: 'finalist' },
        { label: 'Shortlisted', value: 'shortlisted' },
      ],
      defaultValue: 'won',
    },
  ],
}
