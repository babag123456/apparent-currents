'use client'

import { Button } from '@payloadcms/ui'
import React, { useState } from 'react'

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the email is still
      // shown for manual copy.
    }
  }

  return (
    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <code
        style={{
          padding: '.4rem .6rem',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
          background: 'var(--theme-elevation-50)',
          userSelect: 'all',
        }}
      >
        {email}
      </code>
      <Button buttonStyle="secondary" size="small" type="button" onClick={() => void copy()}>
        {copied ? 'Copied ✓' : 'Copy'}
      </Button>
    </div>
  )
}
