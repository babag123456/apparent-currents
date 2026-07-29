'use client'

import Link from 'next/link'

export function GoogleLoginButton() {
  return (
    <div
      style={{
        display: 'grid',
        gap: '0.75rem',
        marginTop: '1rem',
      }}
    >
      {/*
        prefetch={false} is required, not cosmetic: next/link otherwise speculatively
        prefetches this href, executing the /api/auth/google/start GET handler and rotating
        the one-time OAuth state cookie before the real click — which causes
        google_oauth_state_mismatch on the first login attempt.
      */}
      <Link
        prefetch={false}
        href="/api/auth/google/start"
        style={{
          alignItems: 'center',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '999px',
          color: 'inherit',
          display: 'inline-flex',
          fontSize: '0.95rem',
          fontWeight: 500,
          gap: '0.65rem',
          justifyContent: 'center',
          minHeight: '2.875rem',
          padding: '0.75rem 1rem',
          textDecoration: 'none',
          width: '100%',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-grid',
            fontSize: '1rem',
            height: '1.2rem',
            placeItems: 'center',
            width: '1.2rem',
          }}
        >
          G
        </span>
        <span>Continue with Google</span>
      </Link>
    </div>
  )
}

export default GoogleLoginButton
