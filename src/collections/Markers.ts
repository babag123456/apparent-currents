import type { CollectionConfig } from 'payload'

import { denyAccess, isAuthenticated } from '../lib/security/access.ts'

/**
 * Derived markers: individual evidence signals produced by derivation
 * heuristics over evidence records. Machine-written per sync run; each
 * marker keeps its evidence trail so finding → marker → evidence →
 * source stays walkable.
 */
export const Markers: CollectionConfig = {
  slug: 'markers',
  admin: {
    useAsTitle: 'statement',
    defaultColumns: ['statement', 'kind', 'confidence', 'context', 'createdAt'],
    description: 'Machine-derived from evidence. Read-only: markers are never hand-edited.',
  },
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: isAuthenticated,
    update: denyAccess,
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Demand rising', value: 'demand-rising' },
        { label: 'Demand declining', value: 'demand-declining' },
        { label: 'High demand', value: 'high-demand' },
        { label: 'Conversation rising', value: 'conversation-rising' },
        { label: 'Conversation declining', value: 'conversation-declining' },
        { label: 'Sentiment shifting', value: 'sentiment-shifting' },
        { label: 'Behaviour rising', value: 'behaviour-rising' },
        { label: 'Behaviour declining', value: 'behaviour-declining' },
        { label: 'High engagement', value: 'high-engagement' },
        { label: 'Audience over-index', value: 'audience-over-index' },
        { label: 'Audience barrier', value: 'audience-barrier' },
      ],
    },
    {
      name: 'direction',
      type: 'select',
      required: true,
      options: ['up', 'down', 'flat'],
    },
    {
      name: 'confidence',
      type: 'select',
      required: true,
      options: ['weak', 'moderate', 'strong'],
    },
    { name: 'statement', type: 'text', required: true },
    { name: 'phrase', type: 'text', required: true, index: true },
    {
      name: 'topic',
      type: 'text',
      admin: { description: 'Topic / keyword-set inherited from the evidence.' },
    },
    {
      name: 'market',
      type: 'text',
      required: true,
      admin: { description: 'Vendor database / market code the signal applies to.' },
    },
    {
      name: 'magnitude',
      type: 'number',
      required: true,
      admin: {
        description:
          'Signed relative change that triggered the marker (0.4 = +40%); the multiple of the set median for high-demand.',
      },
    },
    {
      name: 'sources',
      type: 'json',
      admin: { description: 'Evidence sources contributing to this marker (array of strings).' },
    },
    { name: 'derivedAt', type: 'date', required: true },
    {
      name: 'context',
      type: 'relationship',
      relationTo: 'contexts',
      required: true,
      index: true,
    },
    {
      name: 'sync',
      type: 'relationship',
      relationTo: 'data-syncs',
      required: true,
      index: true,
    },
    {
      name: 'evidence',
      type: 'relationship',
      relationTo: 'evidence-records',
      hasMany: true,
      admin: { description: 'The evidence records this marker was derived from.' },
    },
  ],
}
