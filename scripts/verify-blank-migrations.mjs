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
  'users_sessions',
  'contexts',
  'contexts_competitors',
  'contexts_topics',
  'evidence_records',
  'markers',
  'markers_rels',
  'data_syncs',
  'payload_jobs',
  'payload_jobs_log',
  'payload_migrations',
  'payload_locked_documents',
  'payload_locked_documents_rels',
  'payload_preferences',
  'payload_preferences_rels',
  'payload_kv',
]

const expectedMigrations = [
  '20260807_085222_initial_baseline',
  '20260807_110910_domain_collections',
]

const source = process.env.DATABASE_URL
if (!source) throw new Error('DATABASE_URL is required.')

const sourceUrl = new URL(source)
const databaseName = `apparent_currents_migration_verify_${Date.now()}`
if (!/^apparent_currents_migration_verify_\d+$/.test(databaseName)) {
  throw new Error('Refusing to manage an unsafe verification database name.')
}

const maintenanceUrl = new URL(sourceUrl)
maintenanceUrl.pathname = '/postgres'
const disposableUrl = new URL(sourceUrl)
disposableUrl.pathname = `/${databaseName}`
const maintenance = new Client({ connectionString: maintenanceUrl.toString() })
let maintenanceConnected = false
const migrate = () => execFileAsync(
  process.execPath,
  [payloadBin, 'migrate', '--config', 'src/payload.config.ts'],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: disposableUrl.toString(),
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'migration-verification-only-secret',
    },
  },
)

try {
  await maintenance.connect()
  maintenanceConnected = true
  await maintenance.query(`CREATE DATABASE "${databaseName}"`)

  await migrate()
  await migrate()

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

    const migrations = await verification.query('SELECT name FROM payload_migrations ORDER BY id')
    const names = migrations.rows.map((row) => row.name)
    if (JSON.stringify(names) !== JSON.stringify(expectedMigrations)) {
      throw new Error(`Unexpected migration history: ${names.join(', ')}`)
    }
  } finally {
    await verification.end()
  }

  console.log(`Blank migration verification passed (${requiredTables.length} required tables, rerun idempotent).`)
} finally {
  if (!maintenanceConnected) {
    await maintenance.connect()
    maintenanceConnected = true
  }
  await maintenance.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`)
  await maintenance.end()
}
