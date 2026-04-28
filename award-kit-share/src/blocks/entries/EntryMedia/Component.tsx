import React from 'react'

interface MediaLike {
  alt?: string | null
  url?: string | null
}

interface Props {
  media: string | MediaLike
  caption?: string | null
  size?: 'default' | 'wide' | 'full' | null
}

const sizeClass: Record<string, string> = {
  default: 'mx-auto max-w-4xl px-6',
  wide: 'mx-auto max-w-6xl px-6',
  full: 'w-full',
}

export const EntryMediaComponent: React.FC<Props> = ({ media, caption, size = 'default' }) => {
  const img = typeof media === 'object' ? media : null
  if (!img?.url) return null

  return (
    <section className="py-8">
      <div className={sizeClass[size ?? 'default']}>
        <img
          src={img.url}
          alt={img.alt || ''}
          className="w-full h-auto rounded-sm"
          loading="lazy"
        />
        {caption && (
          <p className="mt-3 font-mono text-[11px] tracking-wide" style={{ color: 'var(--entry-muted)' }}>{caption}</p>
        )}
      </div>
    </section>
  )
}
