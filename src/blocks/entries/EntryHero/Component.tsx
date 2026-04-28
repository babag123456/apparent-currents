/* eslint-disable @next/next/no-img-element */
import React from 'react'

interface MediaLike {
  alt?: string | null
  url?: string | null
}

interface Props {
  prehead?: string | null
  headline: string
  subhead?: string | null
  media?: string | MediaLike | null
  mediaPosition?: 'below' | 'behind' | 'above' | null
  heroHeight?: 'compact' | 'standard' | 'tall' | 'full' | null
  mediaWidth?: 'contained' | 'wide' | 'full' | null
  textAlign?: 'center' | 'left' | null
  theme?: 'light' | 'dark' | 'plum' | null
}

const heightClass: Record<string, string> = {
  compact: 'min-h-[40vh]',
  standard: 'min-h-[60vh]',
  tall: 'min-h-[80vh]',
  full: 'min-h-screen',
}

const widthClass: Record<string, string> = {
  contained: 'mx-auto max-w-4xl px-6',
  wide: 'mx-auto max-w-6xl px-6',
  full: 'w-full',
}

export const EntryHeroComponent: React.FC<Props> = ({
  prehead,
  headline,
  subhead,
  media,
  mediaPosition = 'below',
  heroHeight = 'standard',
  mediaWidth = 'wide',
  textAlign = 'center',
}) => {
  const img = media && typeof media === 'object' ? media : null
  const pos = mediaPosition ?? 'below'
  const align = textAlign ?? 'center'
  const alignClass = align === 'left' ? 'text-left' : 'text-center'
  const maxWidthClass = align === 'left' ? 'max-w-3xl' : 'max-w-4xl mx-auto'

  // Behind mode: image fills hero, text overlays with gradient
  if (pos === 'behind' && img?.url) {
    const hClass = heightClass[heroHeight ?? 'standard']

    return (
      <section className={`relative ${hClass} flex items-end overflow-hidden`}>
        <img
          src={img.url}
          alt={img.alt || ''}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />
        <div className={`relative z-10 w-full px-6 pb-16 pt-32 md:pb-20 md:pt-40 ${alignClass}`}>
          <div className={`${maxWidthClass}`}>
            {prehead && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/60 mb-6">
                {prehead}
              </p>
            )}
            <h1 className="font-sans text-5xl md:text-7xl font-[500] leading-[1.05] tracking-tight text-cream">
              {headline}
            </h1>
            {subhead && (
              <p className={`mt-6 text-lg md:text-xl font-[300] leading-relaxed text-cream/70 ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}>
                {subhead}
              </p>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Above / Below: text block + image block
  const textBlock = (
    <div className={`${maxWidthClass} px-6 ${alignClass}`}>
      {prehead && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-6" style={{ color: 'var(--entry-muted)' }}>
          {prehead}
        </p>
      )}
      <h1 className="font-sans text-5xl md:text-7xl font-[500] leading-[1.05] tracking-tight" style={{ color: 'var(--entry-text)' }}>
        {headline}
      </h1>
      {subhead && (
        <p className={`mt-6 text-lg md:text-xl font-[300] leading-relaxed ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`} style={{ color: 'var(--entry-muted)' }}>
          {subhead}
        </p>
      )}
    </div>
  )

  const wClass = widthClass[mediaWidth ?? 'wide']
  const imageBlock = img?.url ? (
    <div className={`mt-10 ${wClass}`}>
      <img
        src={img.url}
        alt={img.alt || ''}
        className={`w-full h-auto ${mediaWidth === 'full' ? '' : 'rounded-sm'}`}
        loading="eager"
      />
    </div>
  ) : null

  return (
    <section className="py-24 md:py-32">
      {pos === 'above' && imageBlock}
      {pos === 'above' && imageBlock && <div className="mt-12" />}
      {textBlock}
      {pos === 'below' && imageBlock}
    </section>
  )
}
