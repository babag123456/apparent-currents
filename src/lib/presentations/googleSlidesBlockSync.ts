import { extractGoogleSlidesId } from './googleSlides.ts'
import { isGoogleSlidesConfigured } from './googleServiceAccount.ts'
import { fetchGoogleSlideDeck, type SyncedGoogleSlide } from './googleSlidesSync.ts'
import { deleteUploadThingFile } from '../uploadthing.ts'

type GoogleSlidesDeckBlock = Record<string, unknown> & {
  blockType?: string
  forceSlidesSync?: boolean
  id?: string
  slidesSyncError?: string
  slidesSyncedAt?: string
  slidesUrl?: string
  syncedSlides?: SyncedGoogleSlide[]
}

type FetchDeck = typeof fetchGoogleSlideDeck

async function deleteImages(slides: SyncedGoogleSlide[] | undefined, remove: typeof deleteUploadThingFile): Promise<void> {
  for (const slide of slides ?? []) {
    if (slide.imageKey) await remove(slide.imageKey).catch(() => undefined)
  }
}

/**
 * Payload `beforeValidate` helper: syncs every `entryGoogleSlidesDeck` block in
 * a layout. Skips blocks whose sharing URL is unchanged (unless the author ticks
 * "force sync"), and — like the Figma sync — preserves the last good slides if a
 * re-sync fails so a transient Google error never wipes a working deck.
 */
export async function syncGoogleSlidesDecks({
  configured = isGoogleSlidesConfigured(),
  fetchDeck = fetchGoogleSlideDeck,
  layout,
  now = new Date(),
  previousLayout = [],
  removeImage = deleteUploadThingFile,
}: {
  configured?: boolean
  fetchDeck?: FetchDeck
  layout: GoogleSlidesDeckBlock[]
  now?: Date
  previousLayout?: GoogleSlidesDeckBlock[]
  removeImage?: typeof deleteUploadThingFile
}): Promise<GoogleSlidesDeckBlock[]> {
  const previousById = new Map(previousLayout.flatMap((block) => (block.id ? [[block.id, block]] : [])))
  return Promise.all(
    layout.map(async (block) => {
      if (block.blockType !== 'entryGoogleSlidesDeck') return block
      const previous = block.id ? previousById.get(block.id) : undefined
      const existingSlides = block.syncedSlides?.length ? block.syncedSlides : previous?.syncedSlides
      const unchanged = Boolean(existingSlides?.length && previous?.slidesUrl === block.slidesUrl)
      if (unchanged && !block.forceSlidesSync) return { ...block, syncedSlides: existingSlides }

      if (typeof block.slidesUrl !== 'string' || !extractGoogleSlidesId(block.slidesUrl)) {
        throw new Error('Enter a valid https://docs.google.com/presentation sharing URL before saving.')
      }

      // Let authors add decks before the service-account key is configured: the
      // deck renders via the live-embed fallback until a key is added and the
      // author forces a re-sync to unlock per-slide analytics.
      if (!configured) {
        return {
          ...block,
          ...(existingSlides ? { syncedSlides: existingSlides } : {}),
          slidesSyncError: 'Google Slides service account is not configured yet — showing the live embed without per-slide analytics.',
          forceSlidesSync: undefined,
        }
      }

      try {
        const syncedSlides = await fetchDeck({ slidesUrl: block.slidesUrl })
        // Orphaned images from the previous sync are no longer referenced.
        await deleteImages(previous?.syncedSlides ?? block.syncedSlides, removeImage)
        return {
          ...block,
          syncedSlides,
          slidesSyncedAt: now.toISOString(),
          slidesSyncError: undefined,
          forceSlidesSync: undefined,
        }
      } catch (error) {
        if (!existingSlides?.length) throw error
        return {
          ...block,
          syncedSlides: existingSlides,
          slidesSyncedAt: previous?.slidesSyncedAt ?? block.slidesSyncedAt,
          slidesSyncError: error instanceof Error ? error.message : 'Google could not sync this presentation.',
          forceSlidesSync: undefined,
        }
      }
    }),
  )
}
