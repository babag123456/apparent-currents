import React from 'react'

import type { PublicPresentation } from '../../lib/presentations/repository'
import { PresentationTracker } from './PresentationTracker'
import { EntryThemeProvider } from '../entry-theme/EntryThemeProvider'
import { PresentationBlocks, type PresentationBlock } from './PresentationBlocks'
import { PresentationSlideshow } from './PresentationSlideshow'
import { GoogleSlidesEmbedPlayer } from './GoogleSlidesEmbedPlayer'

export function PresentationView({ presentation, shareToken }: { presentation: PublicPresentation; shareToken: string }) {
  const nativeBlocks = presentation.layout as PresentationBlock[]
  return (
    <EntryThemeProvider initialTheme={presentation.theme}>
    <main className={`presentation-page presentation-page--${presentation.displayMode}`}>
      <PresentationTracker shareToken={shareToken} />
      <header className="presentation-header">
        {presentation.coverImage ? (
          // Payload media URLs may be remote and are already server-authored.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="presentation-cover" src={presentation.coverImage.url} alt={presentation.coverImage.alt ?? ''} />
        ) : null}
        <div className="presentation-intro">
          <p className="presentation-kicker">Client presentation</p>
          <h1>{presentation.title}</h1>
          {presentation.introduction ? <p>{presentation.introduction}</p> : null}
        </div>
      </header>

      {presentation.embedUrl && presentation.slides.length ? (
        <section className="presentation-deck" aria-label={`${presentation.title} slides`}>
          <GoogleSlidesEmbedPlayer embedUrl={presentation.embedUrl} slides={presentation.slides} title={presentation.title} trackAnalytics />
        </section>
      ) : nativeBlocks.length ? presentation.displayMode === 'slideshow' ? (
        <PresentationSlideshow blocks={nativeBlocks} title={presentation.title} />
      ) : (
        <div className="presentation-blocks"><PresentationBlocks blocks={nativeBlocks} /></div>
      ) : presentation.embedUrl ? (
        // Deck not yet synced (e.g. service account not configured): fall back to
        // Google's own player so motion still plays, without per-slide analytics.
        <section className="presentation-stage" aria-label={`${presentation.title} slides`}>
          <iframe
            allow="autoplay; fullscreen"
            allowFullScreen
            className="presentation-frame"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            src={presentation.embedUrl}
            title={presentation.title}
          />
        </section>
      ) : null}

      <footer className="presentation-actions">
        {presentation.openUrl ? <a href={presentation.openUrl} target="_blank" rel="noreferrer">Open presentation ↗</a> : null}
        {presentation.supportingLinks.map((link) => (
          <a key={link.id} data-presentation-link-id={link.id} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>
        ))}
      </footer>
    </main>
    </EntryThemeProvider>
  )
}
