import type { Access, FieldAccess } from 'payload'

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const denyAccess: Access = () => false

export const fieldAuthenticated: FieldAccess = ({ req }) => Boolean(req.user)

export const fieldDeny: FieldAccess = () => false
