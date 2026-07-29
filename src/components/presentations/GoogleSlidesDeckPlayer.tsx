'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { isInteractiveNavigationTarget, nextSlide, previousSlide } from '../../lib/presentations/slideshow'

export type DeckPlayerSlide = { imageUrl: string; title: string; width: number; height: number }

const SWIPE_THRESHOLD = 50

/**
 * Self-contained native slideshow for an inline (module) Google Slides deck:
 * re-hosted slide images with prev/next, keyboard, swipe and true fullscreen —
 * no Google chrome, so viewers never reach presenter notes or the deck menu.
 */
export function GoogleSlidesDeckPlayer({ slides, title }: { slides: DeckPlayerSlide[]; title?: string | null }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const count = slides.length
  const goNext = useCallback(() => setIndex((current) => nextSlide(current, count)), [count])
  const goPrevious = useCallback(() => setIndex((current) => previousSlide(current, count)), [count])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Only steer with the keyboard while this player owns focus.
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

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await rootRef.current?.requestFullscreen()
  }

  if (!count) return null
  const slide = slides[index]
  const accessibleTitle = title?.trim() || 'Google Slides presentation'

  return (
    <div
      aria-label={`${accessibleTitle} slideshow`}
      aria-roledescription="carousel"
      className="google-slides-player"
      ref={rootRef}
      tabIndex={0}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return
        const delta = event.changedTouches[0].clientX - touchStart.current
        touchStart.current = null
        if (Math.abs(delta) < SWIPE_THRESHOLD) return
        if (delta < 0) goNext(); else goPrevious()
      }}
      onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX }}
    >
      <div className="google-slides-player__frame" style={{ aspectRatio: slide.width && slide.height ? `${slide.width} / ${slide.height}` : '16 / 9' }}>
        {/* Slide images are synced server-side and re-hosted on UploadThing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="absolute inset-0 h-full w-full object-contain" src={slide.imageUrl} alt={slide.title || accessibleTitle} loading={index === 0 ? 'eager' : 'lazy'} />
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
