/**
 * Run one metered demand import from the CLI (local convenience — the
 * product path is the import control on /deep-dive/demand, which requires
 * an admin session). Spends real API units when the account has balance.
 *
 * Usage: npx tsx scripts/run-demand-sync.ts [contextId]
 *        (defaults to the oldest context)
 */
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { runDemandSync } from '../src/intelligence/sync/runDemandSync.ts'

const payload = await getPayload({ config })

const argId = process.argv[2] ? Number(process.argv[2]) : null
let contextId = argId
if (!contextId) {
  const contexts = await payload.find({ collection: 'contexts', sort: 'createdAt', limit: 1 })
  if (!contexts.docs[0]) {
    console.error('No contexts exist. Seed one first: npx tsx scripts/seed-demo-context.ts')
    process.exit(1)
  }
  contextId = contexts.docs[0].id
}

console.log(`Running demand sync for context #${contextId}…`)
const result = await runDemandSync({ payload, contextId })
console.dir(result, { depth: null })
process.exit(result.status === 'succeeded' ? 0 : 1)
