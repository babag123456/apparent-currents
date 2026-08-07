import type { CollectionConfig } from 'payload'

import { denyAccess, isAuthenticated } from '../lib/security/access.ts'

/**
 * Canonical evidence records: normalised vendor data with full provenance.
 * Machine-written by sync runs through the Local API (overrideAccess) —
 * humans read them in the admin but never edit them, so the evidence
 * trail stays trustworthy.
 */
export const EvidenceRecords: CollectionConfig = {
  slug: 'evidence-records',
  admin: {
    useAsTitle: 'phrase',
    defaultColumns: ['phrase', 'kind', 'source', 'context', 'createdAt'],
    description: 'Machine-written by imports. Read-only: evidence is never hand-edited.',
  },
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: isAuthenticated,
    update: denyAccess,
  },
  fields: [
    {
      name: 'lens',
      type: 'select',
      required: true,
      defaultValue: 'demand',
      options: ['demand', 'conversation', 'behaviour', 'people'],
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      options: ['semrush', 'brandwatch', 'ga4', 'gwi'],
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Keyword', value: 'keyword' },
        { label: 'Domain keyword', value: 'domain-keyword' },
      ],
    },
    { name: 'phrase', type: 'text', required: true, index: true },
    {
      name: 'topic',
      type: 'text',
      admin: { description: 'Topic / keyword-set the phrase was queried under.' },
    },
    {
      name: 'domain',
      type: 'text',
      admin: { description: 'Ranking domain, for domain-keyword evidence.' },
    },
    {
      name: 'metrics',
      type: 'group',
      fields: [
        { name: 'searchVolume', type: 'number' },
        { name: 'cpc', type: 'number' },
        { name: 'competition', type: 'number' },
        { name: 'resultsCount', type: 'number' },
        { name: 'position', type: 'number' },
        { name: 'previousPosition', type: 'number' },
      ],
    },
    {
      name: 'trend',
      type: 'json',
      admin: { description: 'Normalised 12-month trend series (array of numbers), if valid.' },
    },
    {
      name: 'intents',
      type: 'json',
      admin: { description: 'Search intents (array of strings).' },
    },
    {
      name: 'provenance',
      type: 'group',
      fields: [
        { name: 'sourceReport', type: 'text', required: true },
        { name: 'retrievedAt', type: 'date', required: true },
        {
          name: 'market',
          type: 'text',
          required: true,
          admin: { description: 'Vendor database / market code the data was fetched for.' },
        },
        { name: 'period', type: 'text' },
      ],
    },
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
  ],
}
