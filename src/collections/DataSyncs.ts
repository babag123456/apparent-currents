import type { CollectionConfig } from 'payload'

import { denyAccess, isAuthenticated } from '../lib/security/access.ts'

/**
 * Sync runs: every metered import is a record — when it ran, what it
 * fetched, what it cost in API units, and how it ended. This is the
 * backbone of cache/stale status, duplicate prevention and unit
 * accounting. Machine-written; error messages are sanitised upstream and
 * never contain credentials.
 */
export const DataSyncs: CollectionConfig = {
  slug: 'data-syncs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['context', 'source', 'status', 'startedAt', 'estimatedUnits'],
    description: 'Machine-written import log. Read-only.',
  },
  access: {
    create: denyAccess,
    delete: denyAccess,
    read: isAuthenticated,
    update: denyAccess,
  },
  fields: [
    {
      name: 'context',
      type: 'relationship',
      relationTo: 'contexts',
      required: true,
      index: true,
    },
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
      defaultValue: 'semrush',
      options: ['semrush', 'brandwatch', 'ga4', 'gwi'],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'running',
      options: [
        { label: 'Running', value: 'running' },
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Quota exceeded', value: 'quota-exceeded' },
      ],
      index: true,
    },
    {
      name: 'trigger',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: ['manual'],
    },
    { name: 'startedAt', type: 'date', required: true },
    { name: 'finishedAt', type: 'date' },
    { name: 'requestCount', type: 'number', defaultValue: 0 },
    {
      name: 'estimatedUnits',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Estimated Semrush API units spent by this run.' },
    },
    { name: 'evidenceCount', type: 'number', defaultValue: 0 },
    { name: 'markerCount', type: 'number', defaultValue: 0 },
    {
      name: 'reports',
      type: 'json',
      admin: { description: 'Report types fetched by this run (array of strings).' },
    },
    {
      name: 'errorMessage',
      type: 'text',
      admin: { description: 'Sanitised failure detail — never contains credentials.' },
    },
    {
      name: 'isFixture',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'True when this run was seeded with authored fixture evidence rather than live API data. The UI labels everything from a fixture sync as synthetic.',
      },
    },
  ],
}
