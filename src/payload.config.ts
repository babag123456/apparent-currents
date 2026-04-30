import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users.ts'
import { loadAwardKitEnv } from './lib/loadEnv'
import { awardKitCollections } from './payload/award-kit.config-fragment.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

loadAwardKitEnv()

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
  collections: [Users, ...awardKitCollections],
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
  sharp,
  plugins: [],
})
