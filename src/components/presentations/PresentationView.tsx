import React from 'react'

import type { PublicPresentation } from '../../lib/presentations/repository'

export function PresentationView({ presentation }: { presentation: PublicPresentation }) {
  return (
    <main className="presentation-page">
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

      <section className="presentation-stage" aria-label={`${presentation.title} slides`}>
        <iframe
          allow="fullscreen"
          allowFullScreen
          className="presentation-frame"
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          src={presentation.embedUrl}
          title={presentation.title}
        />
      </section>

      <footer className="presentation-actions">
        <a href={presentation.openUrl} target="_blank" rel="noreferrer">Open presentation ↗</a>
        {presentation.supportingLinks.map((link) => (
          <a key={link.id} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>
        ))}
      </footer>
    </main>
  )
}
