import type { CollectionConfig } from 'payload'

import { denyAccess, isAuthenticated } from '../../lib/security/access.ts'

export const PresentationVisits: CollectionConfig = {
  slug: 'presentation-visits',
  labels: { singular: 'Presentation Visit', plural: 'Presentation Visits' },
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: isAuthenticated,
    update: denyAccess,
  },
  admin: {
    useAsTitle: 'anonymousSessionId',
    defaultColumns: ['presentation', 'visitCount', 'activeSeconds', 'lastSeenAt'],
  },
  fields: [
    { name: 'presentation', type: 'relationship', relationTo: 'presentations' as never, required: true, index: true },
    { name: 'anonymousSessionId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'firstSeenAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'lastSeenAt', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'visitCount', type: 'number', required: true, defaultValue: 1, min: 0, admin: { readOnly: true } },
    { name: 'activeSeconds', type: 'number', required: true, defaultValue: 0, min: 0, admin: { readOnly: true } },
    {
      name: 'deviceCategory',
      type: 'select',
      required: true,
      defaultValue: 'unknown',
      options: ['desktop', 'tablet', 'mobile', 'unknown'],
      admin: { readOnly: true },
    },
    {
      name: 'linkClicks',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'linkId', type: 'text', required: true },
        { name: 'count', type: 'number', required: true, min: 1 },
      ],
    },
  ],
}
