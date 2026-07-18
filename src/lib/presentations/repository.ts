import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { parseGoogleSlidesUrl } from './googleSlides.ts'
import { parseFigmaPrototypeUrl } from './figma.ts'
import { isValidPresentationShareToken } from './shareToken.ts'
import { getSafePublicHref } from '../security/url.ts'
import { classifyDevice, mergeVisitMetrics, type PresentationEvent } from './analytics.ts'

type PresentationDocument = Record<string, unknown> & {
  active?: boolean | null
  coverImage?: unknown
  embedUrl?: string | null
  introduction?: string | null
  layout?: unknown
  openUrl?: string | null
  slidesUrl?: string | null
  supportingLinks?: unknown
  theme?: unknown
  displayMode?: unknown
  title?: string | null
}

type PublicBlock = { id: string; blockType: string } & Record<string, unknown>

export type PublicPresentation = {
  title: string
  theme: 'light' | 'dark'
  displayMode: 'scroll' | 'slideshow'
  layout: PublicBlock[]
  embedUrl?: string
  openUrl?: string
  introduction?: string
  coverImage?: { url: string; alt?: string }
  supportingLinks: Array<{ id: string; label: string; href: string }>
}

const blockFields: Record<string, string[]> = {
  entryHero: ['prehead', 'headline', 'subhead', 'media', 'mediaPosition', 'heroHeight', 'mediaWidth', 'textAlign', 'theme'],
  entryCaseStudy: ['client', 'headline', 'body', 'resultColumns', 'results', 'links', 'images', 'imageLayout'],
  entryRichText: ['richText', 'maxWidth'],
  entryMedia: ['media', 'caption', 'size'],
  entryResults: ['prehead', 'headline', 'intro', 'columns', 'results'],
  entryQuote: ['quote', 'author', 'role'],
  entryImageGrid: ['images', 'columns'],
  entryVideo: ['prehead', 'headline', 'intro', 'source', 'video', 'videoUrl', 'poster', 'caption'],
  entryButton: ['label', 'url', 'style'],
  entrySpacer: ['size'],
  entryDivider: ['color'],
  entryGoogleSlides: ['title', 'slidesUrl'],
}

function sanitiseValue(value: unknown): unknown {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value
  if (Array.isArray(value)) return value.map(sanitiseValue)
  if (!value || typeof value !== 'object') return undefined
  const source = value as Record<string, unknown>
  const allowed = ['id', 'url', 'alt', 'filename', 'mimeType', 'width', 'height', 'sizes', 'thumbnailURL', 'caption', 'image', 'value', 'label', 'style', 'href', 'video', 'poster', 'richText', 'root', 'children', 'type', 'version', 'format', 'indent', 'direction', 'tag', 'text', 'detail', 'mode']
  return Object.fromEntries(allowed.flatMap((key) => key in source ? [[key, sanitiseValue(source[key])]] : []))
}

function sanitiseBlock(value: unknown): PublicBlock | null {
  if (!value || typeof value !== 'object') return null
  const block = value as Record<string, unknown>
  if (typeof block.id !== 'string' || typeof block.blockType !== 'string') return null
  if (block.blockType === 'entryFigmaPrototype') {
    if (typeof block.prototypeUrl !== 'string' || !parseFigmaPrototypeUrl(block.prototypeUrl)) return null
    const title = typeof block.title === 'string' ? block.title.trim() : ''
    return {
      id: block.id,
      blockType: 'entryFigmaPrototype',
      prototypeUrl: block.prototypeUrl,
      ...(title ? { title } : {}),
      interfaceStyle: block.interfaceStyle === 'full' ? 'full' : 'minimal',
    }
  }
  const fields = blockFields[block.blockType]
  if (!fields) return null
  if (block.blockType === 'entryGoogleSlides' &&
    (typeof block.slidesUrl !== 'string' || !parseGoogleSlidesUrl(block.slidesUrl))) return null
  return Object.fromEntries([
    ['id', block.id], ['blockType', block.blockType],
    ...fields.flatMap((key) => key in block ? [[key, sanitiseValue(block[key])]] : []),
  ]) as PublicBlock
}

export function toPublicPresentation(doc: PresentationDocument): PublicPresentation | null {
  const canonical = typeof doc.slidesUrl === 'string' ? parseGoogleSlidesUrl(doc.slidesUrl) : null
  const layout = Array.isArray(doc.layout) ? doc.layout.flatMap((block) => sanitiseBlock(block) ?? []) : []
  if (!doc.title || (!canonical && layout.length === 0)) return null

  const cover = doc.coverImage && typeof doc.coverImage === 'object'
    ? doc.coverImage as { alt?: unknown; url?: unknown }
    : null
  const supportingLinks = Array.isArray(doc.supportingLinks)
    ? doc.supportingLinks.flatMap((value) => {
        if (!value || typeof value !== 'object') return []
        const link = value as { href?: unknown; id?: unknown; label?: unknown }
        if (typeof link.id !== 'string' || typeof link.label !== 'string' || typeof link.href !== 'string') return []
        const href = getSafePublicHref(link.href)
        return href ? [{ id: link.id, label: link.label, href }] : []
      })
    : []

  return {
    title: doc.title,
    theme: doc.theme === 'dark' ? 'dark' : 'light',
    displayMode: doc.displayMode === 'slideshow' ? 'slideshow' : 'scroll',
    layout,
    ...(canonical ? { embedUrl: canonical.embedUrl, openUrl: canonical.openUrl } : {}),
    ...(doc.introduction ? { introduction: doc.introduction } : {}),
    ...(cover && typeof cover.url === 'string'
      ? { coverImage: { url: cover.url, ...(typeof cover.alt === 'string' ? { alt: cover.alt } : {}) } }
      : {}),
    supportingLinks,
  }
}

export async function getPublicPresentation(shareToken: string): Promise<PublicPresentation | null> {
  if (!isValidPresentationShareToken(shareToken)) return null

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'presentations' as never,
    overrideAccess: true,
    depth: 1,
    limit: 1,
    pagination: false,
    where: {
      and: [
        { shareToken: { equals: shareToken } },
        { active: { equals: true } },
        { _status: { equals: 'published' } },
      ],
    },
  })

  return result.docs[0] ? toPublicPresentation(result.docs[0] as PresentationDocument) : null
}

export type LinkClickMetric = { linkId: string; count: number }
export type BlockMetric = { blockId: string; blockType: string; displayMode: 'scroll' | 'slideshow'; viewed: boolean; activeSeconds: number; navigationCount: number }
export type JourneyEntry = { blockId: string; blockType: string; displayMode: 'scroll' | 'slideshow'; viewedAt: string }
const MAX_JOURNEY_ENTRIES = 500

function normalizeJourneyEntry(value: unknown): JourneyEntry | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  if (typeof entry.blockId !== 'string' || typeof entry.blockType !== 'string' ||
    (entry.displayMode !== 'scroll' && entry.displayMode !== 'slideshow') ||
    typeof entry.viewedAt !== 'string' || Number.isNaN(Date.parse(entry.viewedAt))) return null
  return { blockId: entry.blockId, blockType: entry.blockType, displayMode: entry.displayMode, viewedAt: new Date(entry.viewedAt).toISOString() }
}

export function mergeBlockJourney(
  current: unknown[],
  event: Extract<PresentationEvent, { type: 'blockHeartbeat' | 'slideNavigation' }>,
  viewedAt: Date,
): JourneyEntry[] {
  const valid = current.flatMap((entry) => normalizeJourneyEntry(entry) ?? [])
  const previous = valid.at(-1)
  if (previous?.blockId === event.blockId && previous.blockType === event.blockType && previous.displayMode === event.displayMode) return valid
  if (valid.length >= MAX_JOURNEY_ENTRIES) return valid.slice(0, MAX_JOURNEY_ENTRIES)
  return [...valid, { blockId: event.blockId, blockType: event.blockType, displayMode: event.displayMode, viewedAt: viewedAt.toISOString() }]
}

export function mergeBlockMetrics(current: BlockMetric[], event: Extract<PresentationEvent, { type: 'blockHeartbeat' | 'slideNavigation' }>): BlockMetric[] {
  const existing = current.find((metric) => metric.blockId === event.blockId && metric.blockType === event.blockType)
  const next: BlockMetric = {
    blockId: event.blockId, blockType: event.blockType, displayMode: event.displayMode, viewed: true,
    activeSeconds: Math.min(31_536_000, Math.max(0, existing?.activeSeconds ?? 0) + (event.type === 'blockHeartbeat' ? event.activeSeconds : 0)),
    navigationCount: Math.max(0, existing?.navigationCount ?? 0) + (event.type === 'slideNavigation' ? 1 : 0),
  }
  return existing ? current.map((metric) => metric === existing ? next : metric) : [...current, next]
}

export function mergeLinkClicks(current: LinkClickMetric[], linkId: string): LinkClickMetric[] {
  let found = false
  const updated = current.map((click) => {
    if (click.linkId !== linkId) return click
    found = true
    return { linkId, count: Math.max(0, click.count) + 1 }
  })
  return found ? updated : [...updated, { linkId, count: 1 }]
}

export async function recordPresentationEvent({
  shareToken,
  event,
  userAgent,
  now = new Date(),
}: {
  shareToken: string
  event: PresentationEvent
  userAgent: string
  now?: Date
}): Promise<'not-found' | 'recorded'> {
  if (!isValidPresentationShareToken(shareToken)) return 'not-found'

  const payload = await getPayload({ config: configPromise })
  const presentations = await payload.find({
    collection: 'presentations' as never,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    pagination: false,
    where: { and: [
      { shareToken: { equals: shareToken } },
      { active: { equals: true } },
      { _status: { equals: 'published' } },
    ] },
  })
  const presentation = presentations.docs[0] as unknown as PresentationDocument & { id: number | string }
  if (!presentation) return 'not-found'

  if (event.type === 'linkClick') {
    const validLink = Array.isArray(presentation.supportingLinks) && presentation.supportingLinks.some((value) =>
      value && typeof value === 'object' && (value as { id?: unknown }).id === event.linkId)
    if (!validLink) return 'not-found'
  }
  if (event.type === 'blockHeartbeat' || event.type === 'slideNavigation') {
    const validBlock = Array.isArray(presentation.layout) && presentation.layout.some((value) => value && typeof value === 'object' &&
      (value as { id?: unknown }).id === event.blockId && (value as { blockType?: unknown }).blockType === event.blockType)
    if (!validBlock) return 'not-found'
  }

  const visits = await payload.find({
    collection: 'presentation-visits' as never,
    overrideAccess: true,
    depth: 0,
    limit: 1,
    pagination: false,
    where: { and: [
      { presentation: { equals: presentation.id } },
      { anonymousSessionId: { equals: event.sessionId } },
    ] },
  })
  const existing = visits.docs[0] as unknown as {
    id: number | string
    activeSeconds?: number | null
    visitCount?: number | null
    lastSeenAt?: string | null
    linkClicks?: LinkClickMetric[] | null
    blockMetrics?: BlockMetric[] | null
    blockJourney?: JourneyEntry[] | null
  } | undefined

  if (!existing) {
    await payload.create({
      collection: 'presentation-visits' as never,
      overrideAccess: true,
      data: {
        presentation: presentation.id,
        anonymousSessionId: event.sessionId,
        firstSeenAt: now.toISOString(),
        lastSeenAt: now.toISOString(),
        visitCount: 1,
        activeSeconds: event.type === 'heartbeat' ? event.activeSeconds : 0,
        deviceCategory: classifyDevice(userAgent),
        linkClicks: event.type === 'linkClick' ? [{ linkId: event.linkId, count: 1 }] : [],
        blockMetrics: event.type === 'blockHeartbeat' || event.type === 'slideNavigation' ? mergeBlockMetrics([], event) : [],
        blockJourney: event.type === 'blockHeartbeat' || event.type === 'slideNavigation' ? mergeBlockJourney([], event, now) : [],
      } as never,
    })
    return 'recorded'
  }

  const metrics = mergeVisitMetrics({
    activeSeconds: existing.activeSeconds ?? 0,
    visitCount: existing.visitCount ?? 0,
    lastSeenAt: new Date(existing.lastSeenAt ?? now),
  }, event.type === 'blockHeartbeat' || event.type === 'slideNavigation' ? { type: 'linkClick' } : event, now)
  await payload.update({
    collection: 'presentation-visits' as never,
    id: existing.id,
    overrideAccess: true,
    data: {
      ...metrics,
      lastSeenAt: metrics.lastSeenAt.toISOString(),
      ...(event.type === 'linkClick'
        ? { linkClicks: mergeLinkClicks(existing.linkClicks ?? [], event.linkId) }
        : {}),
      ...(event.type === 'blockHeartbeat' || event.type === 'slideNavigation'
        ? {
            blockMetrics: mergeBlockMetrics(existing.blockMetrics ?? [], event),
            blockJourney: mergeBlockJourney(existing.blockJourney ?? [], event, now),
          }
        : {}),
    } as never,
  })
  return 'recorded'
}
