import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Contexts } from './collections/Contexts.ts'
import { DataSyncs } from './collections/DataSyncs.ts'
import { EvidenceRecords } from './collections/EvidenceRecords.ts'
import { Markers } from './collections/Markers.ts'
import { Users } from './collections/Users.ts'
import { demandSyncTask } from './intelligence/sync/demandSyncTask.ts'
import { loadAppEnv } from './lib/loadEnv.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

loadAppEnv()

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      beforeLogin: ['@/components/payload/GoogleLoginButton#GoogleLoginButton'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Contexts, EvidenceRecords, Markers, DataSyncs],
  jobs: {
    tasks: [demandSyncTask],
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    blocksAsJSON: true,
  }),
  plugins: [],
})
