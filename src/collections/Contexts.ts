import type { CollectionConfig } from 'payload'

import { isAuthenticated } from '../lib/security/access.ts'

/**
 * Analysis contexts: the persistent frame every finding hangs off —
 * Brand · Category · Market · Audience · Period · Competitors — plus the
 * topic seed phrases that drive metered demand fetches. Human-managed in
 * the admin; everything downstream (evidence, markers, syncs) points back
 * to one of these.
 */
export const Contexts: CollectionConfig = {
  slug: 'contexts',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'brand', 'market', 'audience', 'updatedAt'],
  },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Display name, e.g. “Audi · EV Intenders · AU”.' },
    },
    { name: 'brand', type: 'text', required: true },
    { name: 'category', type: 'text' },
    {
      name: 'market',
      type: 'text',
      required: true,
      admin: { description: 'Human label, e.g. “Australia”.' },
    },
    {
      name: 'semrushDatabase',
      type: 'text',
      required: true,
      defaultValue: 'au',
      admin: {
        description: 'Semrush regional database code for this market (e.g. au, us, uk).',
      },
    },
    { name: 'audience', type: 'text' },
    {
      name: 'period',
      type: 'text',
      defaultValue: 'Last 90 days',
      admin: { description: 'Display label for the analysis period.' },
    },
    {
      name: 'competitors',
      type: 'array',
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'topics',
      type: 'array',
      maxRows: 10,
      admin: {
        description:
          'Seed phrases for demand fetches. Each import spends API units per phrase — keep this tight (max 10).',
      },
      fields: [{ name: 'phrase', type: 'text', required: true }],
    },
    {
      name: 'isDemo',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Label this context as a demo context in the UI.' },
    },
  ],
}
