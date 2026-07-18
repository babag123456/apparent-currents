import type { CollectionBeforeValidateHook, CollectionConfig, TypeWithID } from 'payload'

import { createPresentationShareToken, isValidPresentationShareToken } from '../../lib/presentations/shareToken.ts'
import { parseGoogleSlidesUrl, validateGoogleSlidesUrl } from '../../lib/presentations/googleSlides.ts'
import { isAuthenticated } from '../../lib/security/access.ts'
import { validatePublicHref } from '../../lib/security/url.ts'

type PresentationInput = TypeWithID & {
  embedUrl?: string | null
  openUrl?: string | null
  shareToken?: string | null
  slidesUrl?: string | null
  supportingLinks?: Array<{ href?: string | null; id?: string | null; label?: string | null }> | null
}

const preparePresentation: CollectionBeforeValidateHook<PresentationInput> = async ({ data }) => {
  if (!data) return data

  const urls = data.slidesUrl ? parseGoogleSlidesUrl(data.slidesUrl) : null
  const supportingLinks = data.supportingLinks?.map((link) => ({
    ...link,
    id: link.id || createPresentationShareToken().slice(0, 12),
  }))

  return {
    ...data,
    ...(urls ? urls : {}),
    shareToken: data.shareToken || createPresentationShareToken(),
    ...(supportingLinks ? { supportingLinks } : {}),
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
          Field: '@/components/payload/PresentationEngagementSummary#PresentationEngagementSummary',
        },
      },
    },
    { name: 'title', type: 'text', required: true },
    { name: 'clientLabel', type: 'text', label: 'Client / project (internal)' },
    {
      name: 'slidesUrl',
      type: 'text',
      required: true,
      validate: validateGoogleSlidesUrl,
      admin: { description: 'Paste a Google Slides sharing or published URL.' },
    },
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
