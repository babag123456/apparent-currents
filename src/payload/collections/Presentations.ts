import type { CollectionBeforeValidateHook, CollectionConfig, TypeWithID } from 'payload'

import { createPresentationShareToken, isValidPresentationShareToken } from '../../lib/presentations/shareToken.ts'
import { parseGoogleSlidesUrl, validateGoogleSlidesUrl } from '../../lib/presentations/googleSlides.ts'
import { fetchGoogleSlideList, type SyncedGoogleSlide } from '../../lib/presentations/googleSlidesSync.ts'
import { isGoogleSlidesConfigured } from '../../lib/presentations/googleServiceAccount.ts'
import { isAuthenticated } from '../../lib/security/access.ts'
import { validatePublicHref } from '../../lib/security/url.ts'
import { sharedEntryBlocks } from '../../blocks/entries/sharedBlocks.ts'

type PresentationInput = TypeWithID & {
  embedUrl?: string | null
  openUrl?: string | null
  shareToken?: string | null
  slidesUrl?: string | null
  slides?: SyncedGoogleSlide[] | null
  forceSlidesSync?: boolean | null
  slidesSyncedAt?: string | null
  slidesSyncError?: string | null
  supportingLinks?: Array<{ href?: string | null; id?: string | null; label?: string | null }> | null
}

// Sync the deck's slide list (ids + titles) from the Slides API. We keep the
// last good list if a re-sync fails, and degrade gracefully (no throw) when the
// service account isn't configured yet, so authors can still save.
async function resolveSlides(
  data: Partial<PresentationInput>,
  originalDoc: Partial<PresentationInput> | undefined,
  now: Date,
): Promise<Partial<PresentationInput>> {
  if (!data.slidesUrl) return { slides: [], slidesSyncedAt: null, slidesSyncError: null, forceSlidesSync: false }

  const existing = Array.isArray(originalDoc?.slides) ? originalDoc.slides : []
  const unchanged = originalDoc?.slidesUrl === data.slidesUrl && existing.length > 0
  if (unchanged && !data.forceSlidesSync) return { slides: existing }

  if (!isGoogleSlidesConfigured()) {
    return {
      ...(existing.length ? { slides: existing } : {}),
      slidesSyncError: 'Google Slides service account is not configured yet — slides will sync once it is added.',
      forceSlidesSync: false,
    }
  }

  try {
    const slides = await fetchGoogleSlideList({ slidesUrl: data.slidesUrl })
    return { slides, slidesSyncedAt: now.toISOString(), slidesSyncError: null, forceSlidesSync: false }
  } catch (error) {
    if (!existing.length) throw error
    return {
      slides: existing,
      slidesSyncError: error instanceof Error ? error.message : 'Google could not sync this presentation.',
      forceSlidesSync: false,
    }
  }
}

const preparePresentation: CollectionBeforeValidateHook<PresentationInput> = async ({ data, originalDoc }) => {
  if (!data) return data

  const urls = data.slidesUrl ? parseGoogleSlidesUrl(data.slidesUrl) : null
  const supportingLinks = data.supportingLinks?.map((link) => ({
    ...link,
    id: link.id || createPresentationShareToken().slice(0, 12),
  }))
  return {
    ...data,
    ...(urls ? urls : { embedUrl: null, openUrl: null }),
    shareToken: data.shareToken || createPresentationShareToken(),
    ...(supportingLinks ? { supportingLinks } : {}),
    ...(await resolveSlides(data, originalDoc, new Date())),
  }
}

export const Presentations: CollectionConfig = {
  slug: 'presentations',
  labels: { singular: 'Presentation', plural: 'Presentations' },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: isAuthenticated,
    update: isAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'clientLabel', 'active', '_status', 'updatedAt'],
    components: {
      edit: {
        beforeDocumentControls: [{
          path: '@/components/payload/PresentationGoToPageButton',
          exportName: 'PresentationGoToPageButton',
        }],
      },
    },
  },
  hooks: { beforeValidate: [preparePresentation] },
  versions: { drafts: true },
  fields: [
    {
      name: 'engagementSummary',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/PresentationAnalyticsDashboard#PresentationAnalyticsDashboard',
        },
      },
    },
    { name: 'title', type: 'text', required: true },
    { name: 'clientLabel', type: 'text', label: 'Client / project (internal)' },
    {
      name: 'slidesUrl',
      type: 'text',
      label: 'Google Slides URL',
      validate: validateGoogleSlidesUrl,
      admin: { description: 'Editable sharing URL (https://docs.google.com/presentation/d/…). Share the deck with the service-account email so its slides can be synced.' },
    },
    {
      name: 'forceSlidesSync',
      type: 'checkbox',
      label: 'Force re-sync slides on next save',
      admin: { description: 'Tick and save to re-read the deck even if the URL is unchanged (e.g. after adding or reordering slides).' },
    },
    {
      name: 'slides',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'objectId', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
      ],
    },
    { name: 'slidesSyncedAt', type: 'date', admin: { hidden: true, readOnly: true } },
    { name: 'slidesSyncError', type: 'text', admin: { hidden: true, readOnly: true } },
    { name: 'embedUrl', type: 'text', admin: { hidden: true, readOnly: true } },
    { name: 'openUrl', type: 'text', admin: { hidden: true, readOnly: true } },
    {
      name: 'shareToken',
      type: 'text',
      unique: true,
      index: true,
      validate: (value: null | string | undefined) => !value || isValidPresentationShareToken(value) || 'Private token must be a 32-character URL-safe token.',
      admin: {
        description: 'Clear and save to invalidate the old private link and generate a new one.',
        position: 'sidebar',
        readOnly: false,
      },
    },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'coverImage', type: 'relationship', relationTo: 'media' },
    { name: 'introduction', type: 'textarea', maxLength: 2000 },
    {
      name: 'theme',
      type: 'select',
      defaultValue: 'light',
      required: true,
      options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }],
    },
    {
      name: 'displayMode',
      type: 'select',
      defaultValue: 'scroll',
      required: true,
      options: [{ label: 'Scrolling webpage', value: 'scroll' }, { label: 'Full-screen slideshow', value: 'slideshow' }],
      admin: { description: 'Applies to block-based presentations. Google Slides decks always show as the slideshow player.' },
    },
    { name: 'layout', type: 'blocks', blocks: sharedEntryBlocks },
    {
      name: 'supportingLinks',
      type: 'array',
      fields: [
        { name: 'id', type: 'text', required: true, admin: { readOnly: true } },
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true, validate: validatePublicHref },
      ],
    },
  ],
}
