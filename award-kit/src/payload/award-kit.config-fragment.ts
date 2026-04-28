import { AwardEntries } from './collections/AwardEntries.ts'
import { Awards } from './collections/Awards.ts'
import { Media } from './collections/Media.ts'
import { defaultLexical } from './fields/defaultLexical.ts'

export const awardKitCollections = [AwardEntries, Awards, Media]

export const awardKitConfigFragment = {
  collections: awardKitCollections,
  editor: defaultLexical,
}

export const awardKitRequiredPackages = [
  'payload',
  '@payloadcms/next',
  '@payloadcms/richtext-lexical',
  '@payloadcms/db-postgres',
  'next',
  'react',
  'react-dom',
]
