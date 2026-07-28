import React from 'react'

import { parseGoogleSlidesUrl } from '../../../lib/presentations/googleSlides'

type Props = {
  googleSlideImageUrl?: string | null
  googleSlideWidth?: number | null
  googleSlideHeight?: number | null
  slidesUrl?: string | null
  title?: string | null
}

export function EntryGoogleSlidesDeckComponent({
  googleSlideImageUrl,
  googleSlideWidth,
  googleSlideHeight,
  slidesUrl,
  title,
}: Props) {
  const accessibleTitle = title?.trim() || 'Google Slides slide'

  // Expanded synced slide: a re-hosted native image the analytics engine tracks.
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

  // Unsynced fallback: show the live Google embed so the deck is never blank.
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
