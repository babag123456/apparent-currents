import { extractGoogleSlidesId } from './googleSlides.ts'
import { getGoogleSlidesAccessToken } from './googleServiceAccount.ts'
import { uploadBufferToUploadThing } from '../uploadthing.ts'

const SLIDES_API_BASE = 'https://slides.googleapis.com/v1/presentations'
const MAX_TITLE_LENGTH = 120
// Guard against pathological decks so a single save can't fan out unbounded
// thumbnail fetches and uploads.
const MAX_SLIDES = 300

export type SyncedGoogleSlide = {
  objectId: string
  title: string
  imageUrl: string
  imageKey: string
  width: number
  height: number
}

type TextElement = { textRun?: { content?: string } }
type PageElement = { shape?: { text?: { textElements?: TextElement[] } } }
export type GoogleSlidesPage = { objectId?: string; pageElements?: PageElement[] }
export type GoogleSlidesPresentation = { slides?: GoogleSlidesPage[] }

type GoogleThumbnail = { width?: number; height?: number; contentUrl?: string }

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
): Array<{ objectId: string; title: string }> {
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

async function requestJson<T>(fetchImpl: FetchLike, url: string, token: string): Promise<T> {
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Google denied access to this presentation. Share the deck with the service-account email.')
    }
    if (response.status === 404) throw new Error('Google could not find this presentation.')
    if (response.status === 429) throw new Error('Google rate-limited the slide sync. Try again shortly.')
    throw new Error('Google could not sync this presentation.')
  }
  try {
    return (await response.json()) as T
  } catch {
    throw new Error('Google returned an invalid presentation response.')
  }
}

/**
 * Reads a presentation via the Slides API, renders each slide to a PNG
 * thumbnail, and re-hosts every image on UploadThing (the temporary Google
 * `contentUrl`s expire within minutes, so hotlinking is not viable).
 */
export async function fetchGoogleSlideDeck({
  slidesUrl,
  fetchImpl = fetch,
  getAccessToken = () => getGoogleSlidesAccessToken(),
  uploadImage = uploadBufferToUploadThing,
}: {
  slidesUrl: string
  fetchImpl?: FetchLike
  getAccessToken?: () => Promise<string>
  uploadImage?: typeof uploadBufferToUploadThing
}): Promise<SyncedGoogleSlide[]> {
  const identity = extractGoogleSlidesId(slidesUrl)
  if (!identity) throw new Error('Enter a valid https://docs.google.com/presentation sharing URL.')
  if (identity.published) {
    throw new Error('Use the editable /presentation/d/<id> sharing URL, not a published (/d/e/) link, so the deck can be synced.')
  }

  const token = await getAccessToken()
  const presentation = await requestJson<GoogleSlidesPresentation>(
    fetchImpl,
    `${SLIDES_API_BASE}/${encodeURIComponent(identity.presentationId)}?fields=slides.objectId,slides.pageElements.shape.text.textElements.textRun.content`,
    token,
  )
  const ordered = orderGoogleSlides(presentation)

  const synced: SyncedGoogleSlide[] = []
  for (const [index, slide] of ordered.entries()) {
    const thumbnail = await requestJson<GoogleThumbnail>(
      fetchImpl,
      `${SLIDES_API_BASE}/${encodeURIComponent(identity.presentationId)}/pages/${encodeURIComponent(slide.objectId)}/thumbnail?thumbnailProperties.mimeType=PNG&thumbnailProperties.thumbnailSize=LARGE`,
      token,
    )
    if (!thumbnail.contentUrl) throw new Error(`Google returned no image for slide ${index + 1}.`)

    const imageResponse = await fetchImpl(thumbnail.contentUrl)
    if (!imageResponse.ok) throw new Error(`Failed to download slide ${index + 1} image (${imageResponse.status}).`)
    const buffer = Buffer.from(await imageResponse.arrayBuffer())

    const uploaded = await uploadImage({
      buffer,
      filename: `${identity.presentationId}-${slide.objectId}.png`,
      mimeType: 'image/png',
    })

    synced.push({
      objectId: slide.objectId,
      title: slide.title,
      imageUrl: uploaded.url,
      imageKey: uploaded.key,
      width: Math.max(0, Math.round(thumbnail.width ?? 0)),
      height: Math.max(0, Math.round(thumbnail.height ?? 0)),
    })
  }

  return synced
}
