'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { summarizePresentationVisits, type PresentationEngagementSummary as Summary } from '../../lib/presentations/summary'

const EMPTY = summarizePresentationVisits([])

export function PresentationEngagementSummary() {
  const { id } = useDocumentInfo()
  const [summary, setSummary] = useState<Summary>(EMPTY)
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const query = new URLSearchParams({
      'where[presentation][equals]': String(id),
      limit: '100',
      depth: '0',
    })
    fetch(`/api/presentation-visits?${query}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load engagement.')))
      .then((result: { docs?: unknown[] }) => setSummary(summarizePresentationVisits((result.docs ?? []) as never[])))
      .catch((error) => { if (error.name !== 'AbortError') setSummary(EMPTY) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [id])

  if (!id) return null

  return (
    <section style={{ border: '1px solid var(--theme-elevation-150)', padding: '1rem', marginBlock: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Anonymous engagement</h3>
      {loading ? <p>Loading…</p> : (
        <>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem' }}>
            <div><dt>Sessions</dt><dd>{summary.sessions}</dd></div>
            <div><dt>Total visits</dt><dd>{summary.totalVisits}</dd></div>
            <div><dt>Returning</dt><dd>{summary.returningSessions}</dd></div>
            <div><dt>Active time</dt><dd>{Math.round(summary.totalActiveSeconds / 60)} min</dd></div>
            <div><dt>Average</dt><dd>{summary.averageActiveSeconds} sec</dd></div>
            <div><dt>Last viewed</dt><dd>{summary.lastSeenAt ? new Date(summary.lastSeenAt).toLocaleString() : 'Never'}</dd></div>
          </dl>
          {Object.keys(summary.linkClicks).length ? (
            <p>Supporting-link clicks: {Object.entries(summary.linkClicks).map(([id, count]) => `${id}: ${count}`).join(', ')}</p>
          ) : null}
        </>
      )}
    </section>
  )
}
