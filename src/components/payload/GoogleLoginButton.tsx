/* eslint-disable @next/next/no-html-link-for-pages */

export function GoogleLoginButton() {
  return (
    <div
      style={{
        display: 'grid',
        gap: '0.75rem',
        marginTop: '1rem',
      }}
    >
      <a
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
      </a>
    </div>
  )
}

export default GoogleLoginButton
