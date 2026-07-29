'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { isInteractiveNavigationTarget, nextSlide, previousSlide } from '../../lib/presentations/slideshow'

export type EmbedSlide = { objectId: string; title: string }

const SWIPE_THRESHOLD = 50

/**
 * Builds the embed URL for a specific slide. `rm=minimal` trims Google's chrome
 * and the `#slide=id.<objectId>` fragment opens the deck on that slide.
 */
function slideSrc(embedUrl: string, objectId?: string): string {
  const url = new URL(embedUrl)
  url.searchParams.set('rm', 'minimal')
  url.searchParams.set('start', 'false')
  url.searchParams.set('loop', 'false')
  return objectId ? `${url.toString()}#slide=id.${objectId}` : url.toString()
}

/**
 * Renders a Google Slides deck with its live embed (so video and animation
 * play) but with our own navigation instead of Google's. Because we own the
 * current-slide state we can deep-link each slide and, when tracking is on,
 * report it so the analytics engine records per-slide dwell and popularity.
 *
 * Changing slide remounts the iframe (via `key`) so it loads at the target
 * slide — a deliberate trade-off: motion is preserved at the cost of a brief
 * reload on navigation.
 */
export function GoogleSlidesEmbedPlayer({
  embedUrl,
  slides,
  title,
  trackAnalytics = false,
}: {
  embedUrl: string
  slides: EmbedSlide[]
  title?: string | null
  trackAnalytics?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)
  const hasNavigated = useRef(false)
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const count = slides.length
  const goNext = useCallback(() => setIndex((current) => nextSlide(current, count)), [count])
  const goPrevious = useCallback(() => setIndex((current) => previousSlide(current, count)), [count])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!rootRef.current?.contains(document.activeElement) && !document.fullscreenElement) return
      if (isInteractiveNavigationTarget(event.target)) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goNext() }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goPrevious() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrevious])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Let the analytics tracker attribute navigation to the slide we moved to.
  useEffect(() => {
    if (!trackAnalytics) return
    if (!hasNavigated.current) { hasNavigated.current = true; return }
    const slide = slides[index]
    if (slide) {
      window.dispatchEvent(new CustomEvent('presentation:slide-navigation', {
        detail: { blockId: slide.objectId, blockType: 'googleSlide' },
      }))
    }
  }, [index, slides, trackAnalytics])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await rootRef.current?.requestFullscreen()
  }

  if (!count || !embedUrl) return null
  const slide = slides[index]
  const accessibleTitle = title?.trim() || 'Google Slides presentation'

  return (
    <div
      aria-label={`${accessibleTitle} slideshow`}
      aria-roledescription="carousel"
      className="google-slides-player"
      ref={rootRef}
      tabIndex={0}
      // The tracker reads these to attribute dwell to the current slide.
      {...(trackAnalytics ? { 'data-presentation-block-id': slide.objectId, 'data-presentation-block-type': 'googleSlide' } : {})}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return
        const delta = event.changedTouches[0].clientX - touchStart.current
        touchStart.current = null
        if (Math.abs(delta) < SWIPE_THRESHOLD) return
        if (delta < 0) goNext(); else goPrevious()
      }}
      onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX }}
    >
      <div className="google-slides-player__frame">
        <iframe
          key={slide.objectId}
          className="absolute inset-0 h-full w-full border-0"
          src={slideSrc(embedUrl, slide.objectId)}
          title={`${accessibleTitle} — ${slide.title}`}
          allow="autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <nav aria-label="Slideshow controls" className="google-slides-player__controls">
        <button aria-label="Previous slide" disabled={index === 0} onClick={goPrevious} type="button">←</button>
        <span aria-live="polite">{index + 1} / {count}</span>
        <button aria-label="Next slide" disabled={index === count - 1} onClick={goNext} type="button">→</button>
        <button aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'} onClick={() => void toggleFullscreen()} type="button">{isFullscreen ? 'Exit full screen' : 'Full screen'}</button>
      </nav>
      <div aria-hidden="true" className="google-slides-player__progress"><span style={{ width: `${((index + 1) / count) * 100}%` }} /></div>
    </div>
  )
}
