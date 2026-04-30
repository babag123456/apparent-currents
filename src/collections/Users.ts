import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'googleSub',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
}
