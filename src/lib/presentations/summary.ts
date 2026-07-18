export type PresentationVisitInput = {
  activeSeconds?: number | null
  lastSeenAt?: string | null
  linkClicks?: Array<{ count?: number | null; linkId?: string | null }> | null
  blockMetrics?: Array<{ blockId?: string | null; blockType?: string | null; displayMode?: string | null; activeSeconds?: number | null; navigationCount?: number | null; viewed?: boolean | null }> | null
  visitCount?: number | null
}

export type PresentationEngagementSummary = {
  sessions: number
  totalVisits: number
  returningSessions: number
  totalActiveSeconds: number
  averageActiveSeconds: number
  lastSeenAt: string | null
  linkClicks: Record<string, number>
  blockMetrics: Record<string, { activeSeconds: number; navigationCount: number; views: number; displayMode: string }>
}

function safeCount(value: number | null | undefined): number {
  return Number.isSafeInteger(value) ? Math.max(0, value as number) : 0
}

export function summarizePresentationVisits(visits: PresentationVisitInput[]): PresentationEngagementSummary {
  const summary: PresentationEngagementSummary = {
    sessions: visits.length,
    totalVisits: 0,
    returningSessions: 0,
    totalActiveSeconds: 0,
    averageActiveSeconds: 0,
    lastSeenAt: null,
    linkClicks: {},
    blockMetrics: {},
  }

  for (const visit of visits) {
    const visitCount = safeCount(visit.visitCount)
    summary.totalVisits += visitCount
    summary.totalActiveSeconds += safeCount(visit.activeSeconds)
    if (visitCount > 1) summary.returningSessions += 1
    if (visit.lastSeenAt && (!summary.lastSeenAt || visit.lastSeenAt > summary.lastSeenAt)) summary.lastSeenAt = visit.lastSeenAt
    for (const click of visit.linkClicks ?? []) {
      if (!click.linkId) continue
      summary.linkClicks[click.linkId] = (summary.linkClicks[click.linkId] ?? 0) + safeCount(click.count)
    }
    for (const metric of visit.blockMetrics ?? []) {
      if (!metric.blockId || !metric.blockType) continue
      const key = `${metric.blockId} · ${metric.blockType}`
      const current = summary.blockMetrics[key] ?? { activeSeconds: 0, navigationCount: 0, views: 0, displayMode: metric.displayMode ?? 'scroll' }
      current.activeSeconds += safeCount(metric.activeSeconds)
      current.navigationCount += safeCount(metric.navigationCount)
      current.views += metric.viewed ? 1 : 0
      summary.blockMetrics[key] = current
    }
  }

  summary.averageActiveSeconds = summary.sessions
    ? Math.round(summary.totalActiveSeconds / summary.sessions)
    : 0
  return summary
}
