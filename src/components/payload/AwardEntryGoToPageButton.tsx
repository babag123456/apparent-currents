'use client'

import { Button, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React from 'react'

export function AwardEntryGoToPageButton() {
  const { data } = useDocumentInfo()
  const formSlug = useFormFields(([fields]) => fields.slug?.value)
  const slugValue = typeof formSlug === 'string' ? formSlug : data?.slug
  const slug = typeof slugValue === 'string' ? slugValue.trim() : ''

  if (!slug) {
    return null
  }

  return (
    <Button
      buttonStyle="secondary"
      el="anchor"
      newTab
      size="medium"
      type="button"
      url={`/${slug}`}
    >
      Open ↗
    </Button>
  )
}
