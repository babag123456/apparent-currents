import React from 'react'

import { GoogleSlidesEmbedPlayer } from '../../../components/presentations/GoogleSlidesEmbedPlayer'
import type { PresentationEmbed } from '../../../lib/presentations/repository'

type Props = {
  prehead?: string | null
  headline?: string | null
  intro?: string | null
  title?: string | null
  // Resolved server-side in the page loader from the `presentation` relationship.
  presentationEmbed?: PresentationEmbed | null
}

export function EntryGoogleSlidesDeckComponent({ prehead, headline, intro, title, presentationEmbed }: Props) {
  const hasHeader = Boolean(prehead?.trim() || headline?.trim() || intro?.trim())
  if (!hasHeader && !presentationEmbed) return null

  return (
    <section className="google-slides-deck py-8 md:py-12">
      <div className="google-slides-deck__inner mx-auto max-w-[1440px] px-4 md:px-6">
        {hasHeader && (
          <div className="google-slides-deck__header mb-8">
            {prehead?.trim() && <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red mb-3">{prehead}</p>}
            {headline?.trim() && <h2 className="font-sans text-3xl md:text-5xl font-[500] leading-[1.1] tracking-tight" style={{ color: 'var(--entry-text)' }}>{headline}</h2>}
            {intro?.trim() && <p className="mt-5 text-base sm:text-lg md:text-xl font-[300] leading-relaxed whitespace-pre-line" style={{ color: 'var(--entry-muted)' }}>{intro}</p>}
          </div>
        )}
        {presentationEmbed?.slides.length ? (
          <GoogleSlidesEmbedPlayer embedUrl={presentationEmbed.embedUrl} slides={presentationEmbed.slides} title={title || presentationEmbed.title} />
        ) : null}
        {presentationEmbed?.openHref && (
          <a className="google-slides-deck__open mt-4 inline-block font-mono text-xs uppercase tracking-wider underline" href={presentationEmbed.openHref} target="_blank" rel="noreferrer">
            Open presentation ↗
          </a>
        )}
      </div>
    </section>
  )
}
