import type { Block } from 'payload'
import { EntryHero } from './EntryHero/config.ts'
import { EntryCaseStudy } from './EntryCaseStudy/config.ts'
import { EntryRichText } from './EntryRichText/config.ts'
import { EntryMedia } from './EntryMedia/config.ts'
import { EntryResults } from './EntryResults/config.ts'
import { EntryQuote } from './EntryQuote/config.ts'
import { EntryImageGrid } from './EntryImageGrid/config.ts'
import { EntryVideo } from './EntryVideo/config.ts'
import { EntryButton } from './EntryButton/config.ts'
import { EntrySpacer } from './EntrySpacer/config.ts'
import { EntryDivider } from './EntryDivider/config.ts'
import { EntryGoogleSlides } from './EntryGoogleSlides/config.ts'
import { EntryGoogleSlidesDeck } from './EntryGoogleSlidesDeck/config.ts'

export const sharedEntryBlocks: Block[] = [
  EntryHero, EntryCaseStudy, EntryRichText, EntryMedia, EntryResults, EntryQuote,
  EntryImageGrid, EntryVideo, EntryButton, EntrySpacer, EntryDivider, EntryGoogleSlides,
  EntryGoogleSlidesDeck,
]
