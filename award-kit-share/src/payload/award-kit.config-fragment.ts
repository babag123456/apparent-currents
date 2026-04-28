import { AwardEntries } from './collections/AwardEntries'
import { Awards } from './collections/Awards'
import { Media } from './collections/Media'
import { defaultLexical } from './fields/defaultLexical'

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
