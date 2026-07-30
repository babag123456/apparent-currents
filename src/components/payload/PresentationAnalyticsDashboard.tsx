'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { summarizePresentationDashboard, type DashboardBlock, type DashboardVisit } from '../../lib/presentations/dashboard'
import './presentationAnalyticsDashboard.css'

type Page = { docs?: DashboardVisit[]; hasNextPage?: boolean }

const formatTime = (seconds: number) => seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds} sec`

export function PresentationAnalyticsDashboard() {
  const { id, data } = useDocumentInfo()
  // Per-slide analytics come from the synced Google Slides deck (blockType
  // "googleSlide", one row per slide objectId). Fall back to the block layout
  // for older block-based presentations.
  const { blocks, slideTitles } = useMemo<{ blocks: DashboardBlock[]; slideTitles: string[] }>(() => {
    const doc = data as { slides?: unknown; layout?: unknown } | undefined
    const slides = Array.isArray(doc?.slides) ? doc.slides : []
    if (slides.length) {
      const rows: DashboardBlock[] = []
      const titles: string[] = []
      for (const value of slides) {
        if (value && typeof value === 'object' && typeof (value as { objectId?: unknown }).objectId === 'string') {
          rows.push({ id: (value as { objectId: string }).objectId, blockType: 'googleSlide' })
          titles.push(typeof (value as { title?: unknown }).title === 'string' ? (value as { title: string }).title : '')
        }
      }
      return { blocks: rows, slideTitles: titles }
    }
    const layout = Array.isArray(doc?.layout) ? doc.layout : []
    return {
      blocks: layout.flatMap((value) => {
        if (!value || typeof value !== 'object') return []
        const block = value as { id?: unknown; blockType?: unknown }
        return typeof block.id === 'string' && typeof block.blockType === 'string' ? [{ id: block.id, blockType: block.blockType }] : []
      }),
      slideTitles: [],
    }
  }, [data])
  const [visits, setVisits] = useState<DashboardVisit[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    void (async () => {
      try {
        const all: DashboardVisit[] = []
        let page = 1
        let hasNextPage = true
        while (hasNextPage) {
          const query = new URLSearchParams({ 'where[presentation][equals]': String(id), depth: '0', limit: '100', page: String(page) })
          const response = await fetch(`/api/presentation-visits?${query}`, { signal: controller.signal })
          if (!response.ok) throw new Error('Unable to load analytics')
          const result = await response.json() as Page
          all.push(...(result.docs ?? []))
          hasNextPage = Boolean(result.hasNextPage)
          page += 1
        }
        setVisits(all)
      } catch (caught) {
        if ((caught as Error).name !== 'AbortError') setError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [id, retry])

  if (!id) return null
  const dashboard = summarizePresentationDashboard(blocks, visits)
  return (
    <section className="presentation-analytics" aria-busy={loading}>
      <header><p>Private-link activity</p><h3>Presentation analytics</h3></header>
      {loading ? <p className="presentation-analytics__state">Loading engagement…</p> : error ? (
        <div className="presentation-analytics__state"><p>Analytics could not be loaded.</p><button onClick={() => { setLoading(true); setError(false); setRetry((value) => value + 1) }} type="button">Try again</button></div>
      ) : dashboard.overview.viewers === 0 ? (
        <p className="presentation-analytics__state">No views yet. Engagement will appear after someone opens the private presentation link.</p>
      ) : <>
        <dl className="presentation-analytics__overview">
          <div><dt>Anonymous viewers</dt><dd>{dashboard.overview.viewers}</dd></div>
          <div><dt>Total visits</dt><dd>{dashboard.overview.totalVisits}</dd></div>
          <div><dt>Average active time</dt><dd>{formatTime(dashboard.overview.averageActiveSeconds)}</dd></div>
          <div><dt>Completion</dt><dd>{dashboard.overview.completionRate}%</dd></div>
          <div><dt>Most viewed</dt><dd>{dashboard.overview.mostViewedSlide ? `Slide ${dashboard.overview.mostViewedSlide}` : '—'}</dd></div>
        </dl>
        <details className="presentation-analytics__slides">
        <summary>Slide-by-slide detail ({dashboard.slides.length} slides)</summary>
        <div className="presentation-analytics__table-wrap"><table>
          <thead><tr><th>Slide / block</th><th>Viewers</th><th>Reached</th><th>Average time</th><th>Drop-off after</th></tr></thead>
          <tbody>{dashboard.slides.map((slide) => <tr key={`${slide.id}:${slide.blockType}`}>
            <th scope="row"><span>{slide.position}</span><small>{slideTitles[slide.position - 1] || slide.blockType}</small></th>
            <td>{slide.viewers}</td>
            <td><div className="presentation-analytics__reach"><i style={{ width: `${slide.reachedPercent}%` }} /> <span>{slide.reachedPercent}%</span></div></td>
            <td>{formatTime(slide.averageActiveSeconds)}</td>
            <td>{slide.dropOffCount === null ? '—' : `${slide.dropOffCount} (${slide.dropOffPercent}%)`}</td>
          </tr>)}</tbody>
        </table></div>
        </details>
        {dashboard.legacyActivity.length ? <div className="presentation-analytics__legacy"><h4>Legacy activity</h4><p>Activity from blocks that are no longer in this presentation.</p><ul>{dashboard.legacyActivity.map((row) => <li key={`${row.blockId}:${row.blockType}`}>{row.blockType}: {row.viewers} viewers, {formatTime(row.activeSeconds)}</li>)}</ul></div> : null}
        <div className="presentation-analytics__sessions"><h4>Anonymous sessions</h4>{dashboard.sessions.map((session) => <details key={`${session.label}:${session.lastSeenAt}`}>
          <summary><span>{session.label}</span><span>{session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : 'Date unavailable'} · {session.deviceCategory} · {formatTime(session.activeSeconds)}</span></summary>
          <div><p>{session.visitCount} visits · {session.slidesReached} slides/blocks reached · {session.modes.join(' + ') || 'Mode unavailable'}</p>
            {session.journey.length ? <ol>{session.journey.map((entry, index) => <li key={`${entry.viewedAt}:${index}`}>Slide {entry.position} · {entry.blockType} · {entry.displayMode}</li>)}</ol> : <p>No ordered journey recorded for this earlier visit.</p>}
          </div>
        </details>)}</div>
      </>}
    </section>
  )
}
