'use client'

import { Button, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React from 'react'

export function PresentationGoToPageButton() {
  const { data } = useDocumentInfo()
  const formToken = useFormFields(([fields]) => fields.shareToken?.value)
  const tokenValue = typeof formToken === 'string' ? formToken : data?.shareToken
  const token = typeof tokenValue === 'string' ? tokenValue.trim() : ''

  if (!token) return null

  return (
    <Button buttonStyle="secondary" el="anchor" newTab size="medium" type="button" url={`/present/${token}`}>
      Open presentation ↗
    </Button>
  )
}
