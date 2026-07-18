import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { promisify } from 'node:util'

import pg from 'pg'

const { Client } = pg
const execFileAsync = promisify(execFile)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const payloadBin = path.join(projectRoot, 'node_modules', 'payload', 'bin.js')
const requiredTables = [
  'users',
  'media',
  'videos',
  'awards',
  'award_entries',
  'payload_locked_documents_rels',
  'presentations',
  'presentation_visits',
  'presentation_visits_block_metrics',
  'presentation_visits_block_journey',
]

const source = process.env.DATABASE_URL
if (!source) throw new Error('DATABASE_URL is required.')

const sourceUrl = new URL(source)
const databaseName = `award_kit_migration_verify_${Date.now()}`
if (!/^award_kit_migration_verify_\d+$/.test(databaseName)) {
  throw new Error('Refusing to manage an unsafe verification database name.')
}

const maintenanceUrl = new URL(sourceUrl)
maintenanceUrl.pathname = '/postgres'
const disposableUrl = new URL(sourceUrl)
disposableUrl.pathname = `/${databaseName}`
const maintenance = new Client({ connectionString: maintenanceUrl.toString() })
let maintenanceConnected = false

try {
  await maintenance.connect()
  maintenanceConnected = true
  await maintenance.query(`CREATE DATABASE "${databaseName}"`)

  await execFileAsync(process.execPath, [payloadBin, 'migrate', '--config', 'src/payload.config.ts'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: disposableUrl.toString(),
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'migration-verification-only-secret',
    },
  })

  const verification = new Client({ connectionString: disposableUrl.toString() })
  try {
    await verification.connect()
    const { rows } = await verification.query(
      `SELECT table_name, to_regclass('public.' || table_name) IS NOT NULL AS exists
       FROM unnest($1::text[]) AS table_name`,
      [requiredTables],
    )
    const missing = rows.filter((row) => !row.exists).map((row) => row.table_name)
    if (missing.length) throw new Error(`Missing migrated tables: ${missing.join(', ')}`)
  } finally {
    await verification.end()
  }

  console.log(`Blank migration verification passed (${requiredTables.length} required tables).`)
} finally {
  if (!maintenanceConnected) {
    await maintenance.connect()
    maintenanceConnected = true
  }
  await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`)
  await maintenance.end()
}
