import type { CollectionConfig } from 'payload'

import { denyAccess, fieldAuthenticated, fieldDeny } from '../lib/security/access.ts'

const canAccessAdmin = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    admin: canAccessAdmin,
    create: denyAccess,
    delete: denyAccess,
    read: ({ req }) => {
      if (!req.user?.id) return false
      return { id: { equals: req.user.id } }
    },
    unlock: denyAccess,
    update: denyAccess,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      access: {
        create: fieldDeny,
        update: fieldDeny,
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'googleSub',
      type: 'text',
      unique: true,
      index: true,
      access: {
        create: fieldDeny,
        read: fieldAuthenticated,
        update: fieldDeny,
      },
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
  ],
}
