import React from 'react'

interface Props {
  label: string
  url: string
  style?: 'outline' | 'text' | null
}

export const EntryButtonComponent: React.FC<Props> = ({ label, url, style = 'outline' }) => {
  if (!label || !url) return null

  return (
    <section>
      <div className="mx-auto max-w-4xl px-6">
        <a
          href={url}
          target={url.startsWith('/') ? undefined : '_blank'}
          rel={url.startsWith('/') ? undefined : 'noopener noreferrer'}
          className={
            style === 'text'
              ? 'font-mono text-sm text-red transition-opacity hover:opacity-70'
              : 'font-mono text-sm border border-current px-4 py-2 rounded-sm transition-colors hover:bg-red hover:text-cream hover:border-red'
          }
          style={style !== 'text' ? { color: 'var(--entry-text)' } : undefined}
        >
          {label} <span aria-hidden>↗</span>
        </a>
      </div>
    </section>
  )
}
