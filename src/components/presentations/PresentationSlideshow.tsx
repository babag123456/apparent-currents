'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { RenderEntryBlocks } from '../../blocks/entries/RenderEntryBlocks'
import { isInteractiveNavigationTarget, nextSlide, previousSlide } from '../../lib/presentations/slideshow'
import type { PresentationBlock } from './PresentationBlocks'

const SWIPE_THRESHOLD = 50

export function PresentationSlideshow({ blocks, title }: { blocks: PresentationBlock[]; title: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)
  const hasNavigated = useRef(false)
  const [index, setIndex] = useState(0)
  const count = blocks.length
  const goNext = useCallback(() => setIndex((current) => nextSlide(current, count)), [count])
  const goPrevious = useCallback(() => setIndex((current) => previousSlide(current, count)), [count])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIndex(Math.max(0, Math.min(count - 1, Number(window.location.hash.slice(1)) - 1 || 0)))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [count])

  useEffect(() => {
    window.history.replaceState(null, '', `#${index + 1}`)
    if (hasNavigated.current) {
      const block = blocks[index]
      window.dispatchEvent(new CustomEvent('presentation:slide-navigation', { detail: { blockId: block.id, blockType: block.blockType } }))
    } else {
      hasNavigated.current = true
    }
  }, [blocks, index])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveNavigationTarget(event.target)) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); goNext() }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); goPrevious() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrevious])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await rootRef.current?.requestFullscreen()
  }

  if (!count) return null
  const block = blocks[index]
  return (
    <div
      aria-label={`${title} slideshow`}
      className="presentation-slideshow"
      onTouchEnd={(event) => {
        if (touchStart.current === null) return
        const delta = event.changedTouches[0].clientX - touchStart.current
        touchStart.current = null
        if (Math.abs(delta) < SWIPE_THRESHOLD) return
        if (delta < 0) goNext(); else goPrevious()
      }}
      onTouchStart={(event) => { touchStart.current = event.changedTouches[0].clientX }}
      ref={rootRef}
    >
      <div className="presentation-slide" data-presentation-block-id={block.id} data-presentation-block-type={block.blockType}>
        <RenderEntryBlocks blocks={[block]} />
      </div>
      <nav aria-label="Slideshow controls" className="presentation-controls">
        <button disabled={index === 0} onClick={goPrevious} type="button" aria-label="Previous slide">←</button>
        <span aria-live="polite">{index + 1} / {count}</span>
        <button disabled={index === count - 1} onClick={goNext} type="button" aria-label="Next slide">→</button>
        <button onClick={() => void toggleFullscreen()} type="button">Full screen</button>
      </nav>
      <div className="presentation-progress" aria-hidden="true"><span style={{ width: `${((index + 1) / count) * 100}%` }} /></div>
    </div>
  )
}
