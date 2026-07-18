'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'thisisour.presentation.session'

export function PresentationTracker({ shareToken }: { shareToken: string }) {
  useEffect(() => {
    let sessionId = localStorage.getItem(STORAGE_KEY)
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, sessionId)
    }

    let pendingSeconds = 0
    let lastActivity = Date.now()
    const send = (event: Record<string, unknown>, beacon = false) => {
      const body = JSON.stringify({ shareToken, event: { ...event, sessionId } })
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/presentation-events', body)
        return
      }
      void fetch('/api/presentation-events', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => undefined)
    }

    const markActivity = () => { lastActivity = Date.now() }
    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'focus'] as const
    activityEvents.forEach((name) => window.addEventListener(name, markActivity, { passive: true }))
    send({ type: 'open' })

    const counter = window.setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - lastActivity <= 30_000) pendingSeconds += 1
    }, 1000)
    const flush = (beacon = false) => {
      if (pendingSeconds < 1) return
      const activeSeconds = Math.min(15, pendingSeconds)
      pendingSeconds -= activeSeconds
      send({ type: 'heartbeat', activeSeconds }, beacon)
    }
    const flusher = window.setInterval(() => flush(), 15_000)
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(true) }
    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>('[data-presentation-link-id]')
      const linkId = element?.dataset.presentationLinkId
      if (linkId) send({ type: 'linkClick', linkId }, true)
    }
    let activeBlock: HTMLElement | null = null
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) activeBlock = visible.target as HTMLElement
    }, { threshold: [0.25, 0.5, 0.75] })
    document.querySelectorAll<HTMLElement>('[data-presentation-block-id]').forEach((block) => observer.observe(block))
    const blockFlusher = window.setInterval(() => {
      const blockId = activeBlock?.dataset.presentationBlockId
      const blockType = activeBlock?.dataset.presentationBlockType
      if (blockId && blockType && document.visibilityState === 'visible') {
        send({ type: 'blockHeartbeat', blockId, blockType,
          displayMode: document.querySelector('.presentation-slideshow') ? 'slideshow' : 'scroll', activeSeconds: 15 })
      }
    }, 15_000)
    const onSlideNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ blockId?: string; blockType?: string }>).detail
      if (detail?.blockId && detail.blockType) send({ type: 'slideNavigation', ...detail, displayMode: 'slideshow' })
    }
    window.addEventListener('presentation:slide-navigation', onSlideNavigation)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('click', onClick)

    return () => {
      flush(true)
      window.clearInterval(counter)
      window.clearInterval(flusher)
      window.clearInterval(blockFlusher)
      observer.disconnect()
      window.removeEventListener('presentation:slide-navigation', onSlideNavigation)
      activityEvents.forEach((name) => window.removeEventListener(name, markActivity))
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('click', onClick)
    }
  }, [shareToken])

  return null
}
