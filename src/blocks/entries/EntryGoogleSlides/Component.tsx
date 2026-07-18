import React from 'react'

import { parseGoogleSlidesUrl } from '../../../lib/presentations/googleSlides'

export function EntryGoogleSlidesComponent({ slidesUrl, title }: { slidesUrl?: string | null; title?: string | null }) {
  const urls = slidesUrl ? parseGoogleSlidesUrl(slidesUrl) : null
  if (!urls) return null
  const accessibleTitle = title?.trim() || 'Google Slides presentation'
  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe className="absolute inset-0 h-full w-full border-0" src={urls.embedUrl} title={accessibleTitle} allow="fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
        <a className="mt-3 inline-block font-mono text-xs uppercase tracking-wider underline" href={urls.openUrl} target="_blank" rel="noreferrer">Open presentation ↗</a>
      </div>
    </section>
  )
}
