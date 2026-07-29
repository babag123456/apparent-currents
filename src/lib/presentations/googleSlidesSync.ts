import { extractGoogleSlidesId } from './googleSlides.ts'
import { getGoogleSlidesAccessToken } from './googleServiceAccount.ts'

const SLIDES_API_BASE = 'https://slides.googleapis.com/v1/presentations'
const MAX_TITLE_LENGTH = 120
// Guard against pathological decks so a single save can't fan out unbounded work.
const MAX_SLIDES = 500

export type SyncedGoogleSlide = {
  objectId: string
  title: string
}

type TextElement = { textRun?: { content?: string } }
type PageElement = { shape?: { text?: { textElements?: TextElement[] } } }
export type GoogleSlidesPage = { objectId?: string; pageElements?: PageElement[] }
export type GoogleSlidesPresentation = { slides?: GoogleSlidesPage[] }

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>

/**
 * Derives a human-readable slide title from the first non-empty text run on the
 * slide, falling back to a positional label. Slides carry no title field, so
 * this mirrors what an author would recognise as the slide heading.
 */
export function deriveSlideTitle(page: GoogleSlidesPage, index: number): string {
  for (const element of page.pageElements ?? []) {
    const text = (element.shape?.text?.textElements ?? [])
      .map((textElement) => textElement.textRun?.content ?? '')
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) return text.slice(0, MAX_TITLE_LENGTH)
  }
  return `Slide ${index + 1}`
}

/**
 * Extracts an ordered, validated list of slides (object id + derived title)
 * from a Slides API `presentations.get` response. Pure and network-free so it
 * can be unit tested.
 */
export function orderGoogleSlides(
  presentation: GoogleSlidesPresentation,
): SyncedGoogleSlide[] {
  const slides = Array.isArray(presentation.slides) ? presentation.slides : []
  const ordered = slides.flatMap((page, index) =>
    typeof page.objectId === 'string' && page.objectId
      ? [{ objectId: page.objectId, title: deriveSlideTitle(page, index) }]
      : [],
  )
  if (!ordered.length) throw new Error('Google Slides presentation contains no slides.')
  if (ordered.length > MAX_SLIDES) {
    throw new Error(`Google Slides presentation has ${ordered.length} slides, which exceeds the ${MAX_SLIDES}-slide limit.`)
  }
  return ordered
}

/**
 * Reads a presentation via the Slides API and returns its ordered slide ids +
 * derived titles. We only need the slide list (not images): the deck is shown
 * with Google's live embed so video and animation play, and these ids let our
 * custom navigation deep-link each slide and give analytics a stable per-slide
 * identity.
 */
export async function fetchGoogleSlideList({
  slidesUrl,
  fetchImpl = fetch,
  getAccessToken = () => getGoogleSlidesAccessToken(),
}: {
  slidesUrl: string
  fetchImpl?: FetchLike
  getAccessToken?: () => Promise<string>
}): Promise<SyncedGoogleSlide[]> {
  const identity = extractGoogleSlidesId(slidesUrl)
  if (!identity) throw new Error('Enter a valid https://docs.google.com/presentation sharing URL.')
  if (identity.published) {
    throw new Error('Use the editable /presentation/d/<id> sharing URL, not a published (/d/e/) link, so the deck can be synced.')
  }

  const token = await getAccessToken()
  const response = await fetchImpl(
    `${SLIDES_API_BASE}/${encodeURIComponent(identity.presentationId)}?fields=slides.objectId,slides.pageElements.shape.text.textElements.textRun.content`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Google denied access to this presentation. Share the deck with the service-account email.')
    }
    if (response.status === 404) throw new Error('Google could not find this presentation.')
    if (response.status === 429) throw new Error('Google rate-limited the slide sync. Try again shortly.')
    throw new Error('Google could not sync this presentation.')
  }
  let presentation: GoogleSlidesPresentation
  try {
    presentation = (await response.json()) as GoogleSlidesPresentation
  } catch {
    throw new Error('Google returned an invalid presentation response.')
  }
  return orderGoogleSlides(presentation)
}
