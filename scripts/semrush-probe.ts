/**
 * One narrow live Semrush request to validate the integration end-to-end:
 * key works, CSV parses, normalizer assumptions hold (trend ordering,
 * intent codes). Prints normalized evidence, derived markers, and the
 * estimated unit spend. Costs real API units (10/line, small limit).
 *
 * Usage:
 *   npx tsx scripts/semrush-probe.ts "<seed phrase>" [database=au]
 */
import { SemrushApiError, SemrushClient } from '../src/integrations/semrush/client.ts'
import { fetchKeywordOverview } from '../src/integrations/semrush/queries/index.ts'
import { deriveDemandMarkers } from '../src/intelligence/markers/deriveDemandMarkers.ts'
import { loadAppEnv } from '../src/lib/loadEnv.ts'

loadAppEnv()

const [phrase, database = 'au'] = process.argv.slice(2)

if (!phrase) {
  console.error('Usage: npx tsx scripts/semrush-probe.ts "<seed phrase>" [database=au]')
  process.exit(1)
}
if (!process.env.SEMRUSH_API_KEY) {
  console.error('SEMRUSH_API_KEY is not set in .env — refusing to probe.')
  process.exit(1)
}

const client = new SemrushClient()

let outcome
try {
  outcome = await fetchKeywordOverview(client, { phrases: [phrase], database })
} catch (error) {
  if (error instanceof SemrushApiError && error.code === 132) {
    console.error(
      'Semrush key is valid, but the account has no API units (ERROR 132).\n' +
        'API units are purchased separately from the Semrush subscription:\n' +
        'Semrush → Subscription info → API units. Re-run this probe once topped up.',
    )
    process.exit(1)
  }
  throw error
}
const { evidence, report } = outcome

console.log(`Report: ${report.reportType} (${report.database})`)
console.log(`Rows: ${report.rows.length} · estimated units spent: ${report.estimatedUnits}`)
console.log('\nRaw first row (verify column names/encodings):')
console.dir(report.rows[0] ?? null, { depth: null })
console.log('\nNormalized evidence:')
console.dir(evidence, { depth: null })
console.log('\nDerived markers:')
console.dir(
  deriveDemandMarkers(evidence).map((marker) => ({ ...marker, evidence: undefined })),
  { depth: null },
)
