import React from 'react'

import { readGoogleSlidesCredentials } from '../../lib/presentations/googleServiceAccount'
import { CopyEmailButton } from './CopyEmailButton'

// Server component: reads the configured service-account email (server-only env)
// and shows it with a copy button. The email is an identifier, not a secret —
// the private key stays in env and is never exposed.
export function SlidesServiceAccountField() {
  const email = readGoogleSlidesCredentials()?.clientEmail

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <label className="field-label">Service account</label>
      {email ? (
        <>
          <p style={{ margin: '0 0 .5rem', color: 'var(--theme-elevation-500)' }}>
            Share your Google Slides deck with this email (Viewer) so its slides can sync.
          </p>
          <CopyEmailButton email={email} />
        </>
      ) : (
        <p style={{ margin: 0, color: 'var(--theme-elevation-500)' }}>
          Set GOOGLE_SLIDES_CLIENT_EMAIL (or GOOGLE_SLIDES_CREDENTIALS_JSON) to enable slide syncing.
        </p>
      )}
    </div>
  )
}
