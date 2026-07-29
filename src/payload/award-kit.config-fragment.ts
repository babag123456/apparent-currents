import { AwardEntries } from './collections/AwardEntries.ts'
import { Media } from './collections/Media.ts'
import { Videos } from './collections/Videos.ts'
import { Presentations } from './collections/Presentations.ts'
import { PresentationVisits } from './collections/PresentationVisits.ts'
import { defaultLexical } from './fields/defaultLexical.ts'

export const awardKitCollections = [AwardEntries, Media, Videos, Presentations, PresentationVisits]

export const awardKitConfigFragment = {
  collections: awardKitCollections,
  editor: defaultLexical,
}

export const awardKitRequiredPackages = [
  'payload',
  '@next/env',
  '@payloadcms/next',
  '@payloadcms/richtext-lexical',
  '@payloadcms/db-postgres',
  'mime-types',
  'uploadthing',
  'next',
  'react',
  'react-dom',
]
