import React from 'react'

import { parseGoogleSlidesUrl } from '../../../lib/presentations/googleSlides'
import { GoogleSlidesDeckPlayer, type DeckPlayerSlide } from '../../../components/presentations/GoogleSlidesDeckPlayer'

type SyncedSlide = { imageUrl?: string | null; title?: string | null; width?: number | null; height?: number | null }

type Props = {
  googleSlideImageUrl?: string | null
  googleSlideWidth?: number | null
  googleSlideHeight?: number | null
  slidesUrl?: string | null
  syncedSlides?: SyncedSlide[] | null
  title?: string | null
}

export function EntryGoogleSlidesDeckComponent({
  googleSlideImageUrl,
  googleSlideWidth,
  googleSlideHeight,
  slidesUrl,
  syncedSlides,
  title,
}: Props) {
  const accessibleTitle = title?.trim() || 'Google Slides slide'

  // On the presentation page each deck is expanded into one tracked block per
  // slide, so this branch renders a single re-hosted image.
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

  // Inline (module) use: a synced deck renders as a self-contained native
  // slideshow — images only, so viewers never reach presenter notes or the
  // Google menu. Only image fields are passed to the client (never slidesUrl).
  const slides: DeckPlayerSlide[] = Array.isArray(syncedSlides)
    ? syncedSlides.flatMap((slide) =>
        slide && typeof slide.imageUrl === 'string'
          ? [{ imageUrl: slide.imageUrl, title: typeof slide.title === 'string' ? slide.title : '', width: Number(slide.width) || 0, height: Number(slide.height) || 0 }]
          : [],
      )
    : []
  if (slides.length) {
    return (
      <section className="google-slides-deck py-8 md:py-12">
        <div className="google-slides-deck__inner mx-auto max-w-[1440px] px-4 md:px-6">
          <GoogleSlidesDeckPlayer slides={slides} title={title} />
        </div>
      </section>
    )
  }

  // Unsynced fallback: show the live Google embed so the deck is never blank
  // until the service account is configured and the deck is synced.
  const urls = slidesUrl ? parseGoogleSlidesUrl(slidesUrl) : null
  if (!urls) return null
  return (
    <section className="google-slides-deck py-8 md:py-12">
      <div className="google-slides-deck__inner mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="google-slides-deck__frame" style={{ aspectRatio: '16 / 9' }}>
          <iframe className="absolute inset-0 h-full w-full border-0" src={urls.embedUrl} title={accessibleTitle} allow="fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
        <a className="google-slides-deck__fallback mt-3 inline-block font-mono text-xs uppercase tracking-wider underline" href={urls.openUrl} target="_blank" rel="noreferrer">Open presentation ↗</a>
      </div>
    </section>
  )
}
