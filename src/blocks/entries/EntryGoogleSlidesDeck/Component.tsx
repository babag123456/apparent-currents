import React from 'react'

import { GoogleSlidesDeckPlayer, type DeckPlayerSlide } from '../../../components/presentations/GoogleSlidesDeckPlayer'

type SyncedSlide = { imageUrl?: string | null; title?: string | null; width?: number | null; height?: number | null }

type Props = {
  prehead?: string | null
  headline?: string | null
  intro?: string | null
  title?: string | null
  // Set only on the presentation page, where each deck is expanded to one
  // tracked block per slide.
  googleSlideImageUrl?: string | null
  googleSlideWidth?: number | null
  googleSlideHeight?: number | null
  // Present in the inline (module) context, straight from the stored block.
  syncedSlides?: SyncedSlide[] | null
  // Resolved server-side in the page loader when a presentation is linked.
  linkedPresentationHref?: string | null
}

export function EntryGoogleSlidesDeckComponent({
  prehead,
  headline,
  intro,
  title,
  googleSlideImageUrl,
  googleSlideWidth,
  googleSlideHeight,
  syncedSlides,
  linkedPresentationHref,
}: Props) {
  const accessibleTitle = title?.trim() || 'Google Slides slide'

  // Presentation page: a single expanded, individually tracked slide image.
  if (googleSlideImageUrl) {
    const aspectRatio = googleSlideWidth && googleSlideHeight ? `${googleSlideWidth} / ${googleSlideHeight}` : '16 / 9'
    return (
      <section className="google-slides-deck py-8 md:py-12">
        <div className="google-slides-deck__inner mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="google-slides-deck__frame" style={{ aspectRatio }}>
            {/* Slide images are synced server-side and re-hosted on UploadThing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="absolute inset-0 h-full w-full object-contain" src={googleSlideImageUrl} alt={accessibleTitle} loading="lazy" />
          </div>
        </div>
      </section>
    )
  }

  // Inline (module) use: header + a self-contained native slideshow of the
  // synced images. No Google iframe, so viewers never see the Google Slides
  // chrome or reach presenter notes.
  const slides: DeckPlayerSlide[] = Array.isArray(syncedSlides)
    ? syncedSlides.flatMap((slide) =>
        slide && typeof slide.imageUrl === 'string'
          ? [{ imageUrl: slide.imageUrl, title: typeof slide.title === 'string' ? slide.title : '', width: Number(slide.width) || 0, height: Number(slide.height) || 0 }]
          : [],
      )
    : []

  const hasHeader = Boolean(prehead?.trim() || headline?.trim() || intro?.trim())
  if (!hasHeader && !slides.length && !linkedPresentationHref) return null

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
        {slides.length ? <GoogleSlidesDeckPlayer slides={slides} title={title} /> : null}
        {linkedPresentationHref && (
          <a className="google-slides-deck__open mt-4 inline-block font-mono text-xs uppercase tracking-wider underline" href={linkedPresentationHref} target="_blank" rel="noreferrer">
            Open presentation ↗
          </a>
        )}
      </div>
    </section>
  )
}
