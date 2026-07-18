import React from 'react'

import {
  parseFigmaPrototypeUrl,
  type FigmaInterfaceStyle,
} from '../../../lib/presentations/figma'

type Props = {
  interfaceStyle?: FigmaInterfaceStyle | null
  prototypeUrl?: string | null
  title?: string | null
}

export function EntryFigmaPrototypeComponent({ interfaceStyle, prototypeUrl, title }: Props) {
  const urls = prototypeUrl
    ? parseFigmaPrototypeUrl(prototypeUrl, interfaceStyle === 'full' ? 'full' : 'minimal')
    : null
  if (!urls) return null

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            allow="fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            referrerPolicy="strict-origin-when-cross-origin"
            src={urls.embedUrl}
            title={title?.trim() || 'Figma prototype'}
          />
        </div>
        <a
          className="mt-3 inline-block font-mono text-xs uppercase tracking-wider underline"
          href={urls.openUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open prototype in Figma ↗
        </a>
      </div>
    </section>
  )
}
