export type PresentationVisitInput = {
  activeSeconds?: number | null
  lastSeenAt?: string | null
  linkClicks?: Array<{ count?: number | null; linkId?: string | null }> | null
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
  }

  summary.averageActiveSeconds = summary.sessions
    ? Math.round(summary.totalActiveSeconds / summary.sessions)
    : 0
  return summary
}
