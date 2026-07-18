import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { parseGoogleSlidesUrl } from './googleSlides.ts'
import { isValidPresentationShareToken } from './shareToken.ts'
import { getSafePublicHref } from '../security/url.ts'

type PresentationDocument = Record<string, unknown> & {
  active?: boolean | null
  coverImage?: unknown
  embedUrl?: string | null
  introduction?: string | null
  openUrl?: string | null
  slidesUrl?: string | null
  supportingLinks?: unknown
  title?: string | null
}

export type PublicPresentation = {
  title: string
  embedUrl: string
  openUrl: string
  introduction?: string
  coverImage?: { url: string; alt?: string }
  supportingLinks: Array<{ id: string; label: string; href: string }>
}

export function toPublicPresentation(doc: PresentationDocument): PublicPresentation | null {
  const canonical = typeof doc.slidesUrl === 'string' ? parseGoogleSlidesUrl(doc.slidesUrl) : null
  const embedUrl = canonical?.embedUrl ?? doc.embedUrl
  const openUrl = canonical?.openUrl ?? doc.openUrl
  if (!doc.title || !embedUrl || !openUrl) return null

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
    embedUrl,
    openUrl,
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
