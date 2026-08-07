/**
 * Local convenience: create the confirmed demo analysis context (Audi ·
 * Premium Automotive · Australia · EV Intenders) so the Demand lens has a
 * context to import against. Refuses to run if any context already
 * exists — contexts are otherwise managed in the Payload admin.
 *
 * Usage: npx tsx scripts/seed-demo-context.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'

const payload = await getPayload({ config })

const existing = await payload.find({ collection: 'contexts', limit: 1, overrideAccess: true })
if (existing.totalDocs > 0) {
  console.error(`Refusing to seed: ${existing.totalDocs} context(s) already exist.`)
  process.exit(1)
}

const context = await payload.create({
  collection: 'contexts',
  overrideAccess: true,
  data: {
    name: 'Audi · EV Intenders · AU (demo)',
    brand: 'Audi',
    category: 'Premium Automotive',
    market: 'Australia',
    semrushDatabase: 'au',
    audience: 'EV Intenders',
    period: 'Last 90 days',
    competitors: [{ name: 'BMW' }, { name: 'Mercedes-Benz' }, { name: 'Volvo' }],
    topics: [
      { phrase: 'ev charging' },
      { phrase: 'home ev charger' },
      { phrase: 'electric car range' },
      { phrase: 'audi e-tron' },
      { phrase: 'phev vs ev' },
    ],
    isDemo: true,
  },
})

console.log(`Seeded demo context #${context.id}: ${context.name}`)
process.exit(0)
