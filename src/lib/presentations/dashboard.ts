export type DashboardBlock = { id: string; blockType: string }
type BlockMetric = { blockId?: string | null; blockType?: string | null; displayMode?: string | null; viewed?: boolean | null; activeSeconds?: number | null; navigationCount?: number | null }
type JourneyEntry = { blockId?: string | null; blockType?: string | null; displayMode?: string | null; viewedAt?: string | null }
export type DashboardVisit = {
  anonymousSessionId?: string | null
  visitCount?: number | null
  activeSeconds?: number | null
  lastSeenAt?: string | null
  deviceCategory?: string | null
  blockMetrics?: BlockMetric[] | null
  blockJourney?: JourneyEntry[] | null
}

type SlideRow = DashboardBlock & { position: number; viewers: number; reachedPercent: number; activeSeconds: number; averageActiveSeconds: number; navigationCount: number; dropOffCount: number | null; dropOffPercent: number | null }
type SessionRow = { label: string; lastSeenAt: string | null; deviceCategory: string; visitCount: number; activeSeconds: number; modes: string[]; slidesReached: number; journey: Array<{ position: number; blockType: string; displayMode: string; viewedAt: string }> }
type LegacyRow = { blockId: string; blockType: string; viewers: number; activeSeconds: number; navigationCount: number }
export type PresentationDashboard = {
  overview: { viewers: number; totalVisits: number; totalActiveSeconds: number; averageActiveSeconds: number; completionRate: number; mostViewedSlide: number | null }
  slides: SlideRow[]
  sessions: SessionRow[]
  legacyActivity: LegacyRow[]
}

const safeCount = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) ? Math.max(0, value) : 0
const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0
const identity = (block: { id?: unknown; blockType?: unknown }) => typeof block.id === 'string' && typeof block.blockType === 'string' ? `${block.id}:${block.blockType}` : null

export function summarizePresentationDashboard(blocks: DashboardBlock[], visits: DashboardVisit[]): PresentationDashboard {
  const current = new Map(blocks.map((block, index) => [identity(block), { ...block, position: index + 1 }]))
  const viewers = visits.length
  const slideStats = blocks.map((block, index) => ({ ...block, position: index + 1, viewers: 0, activeSeconds: 0, navigationCount: 0 }))
  const legacy = new Map<string, LegacyRow>()

  for (const visit of visits) {
    const viewedThisVisit = new Set<string>()
    for (const metric of visit.blockMetrics ?? []) {
      const key = identity({ id: metric.blockId, blockType: metric.blockType })
      if (!key) continue
      const activeSeconds = safeCount(metric.activeSeconds)
      const navigationCount = safeCount(metric.navigationCount)
      const currentBlock = current.get(key)
      if (currentBlock) {
        const row = slideStats[currentBlock.position - 1]
        if (metric.viewed && !viewedThisVisit.has(key)) { row.viewers += 1; viewedThisVisit.add(key) }
        row.activeSeconds += activeSeconds
        row.navigationCount += navigationCount
      } else {
        const row = legacy.get(key) ?? { blockId: String(metric.blockId), blockType: String(metric.blockType), viewers: 0, activeSeconds: 0, navigationCount: 0 }
        if (metric.viewed) row.viewers += 1
        row.activeSeconds += activeSeconds
        row.navigationCount += navigationCount
        legacy.set(key, row)
      }
    }
  }

  const slides: SlideRow[] = slideStats.map((row, index) => {
    const nextViewers = slideStats[index + 1]?.viewers
    const dropOffCount = nextViewers === undefined ? null : Math.max(0, row.viewers - nextViewers)
    return { ...row, reachedPercent: percent(row.viewers, viewers), averageActiveSeconds: row.viewers ? Math.round(row.activeSeconds / row.viewers) : 0,
      dropOffCount, dropOffPercent: dropOffCount === null ? null : percent(dropOffCount, row.viewers) }
  })

  const sessions = [...visits].sort((a, b) => {
    const aTime = a.lastSeenAt && !Number.isNaN(Date.parse(a.lastSeenAt)) ? Date.parse(a.lastSeenAt) : 0
    const bTime = b.lastSeenAt && !Number.isNaN(Date.parse(b.lastSeenAt)) ? Date.parse(b.lastSeenAt) : 0
    return bTime - aTime
  }).map((visit, index): SessionRow => {
    const journey = (visit.blockJourney ?? []).flatMap((entry) => {
      const key = identity({ id: entry.blockId, blockType: entry.blockType })
      const block = key ? current.get(key) : null
      if (!block || typeof entry.viewedAt !== 'string' || Number.isNaN(Date.parse(entry.viewedAt))) return []
      return [{ position: block.position, blockType: block.blockType, displayMode: entry.displayMode === 'slideshow' ? 'slideshow' : 'scroll', viewedAt: new Date(entry.viewedAt).toISOString() }]
    })
    return { label: `Anonymous viewer ${index + 1}`, lastSeenAt: visit.lastSeenAt && !Number.isNaN(Date.parse(visit.lastSeenAt)) ? new Date(visit.lastSeenAt).toISOString() : null,
      deviceCategory: typeof visit.deviceCategory === 'string' ? visit.deviceCategory : 'unknown', visitCount: safeCount(visit.visitCount), activeSeconds: safeCount(visit.activeSeconds),
      modes: [...new Set(journey.map((entry) => entry.displayMode))], slidesReached: new Set(journey.map((entry) => entry.position)).size, journey }
  })

  const totalActiveSeconds = visits.reduce((total, visit) => total + safeCount(visit.activeSeconds), 0)
  const mostViewed = slides.reduce<SlideRow | null>((best, slide) => !best || slide.viewers > best.viewers ? slide : best, null)
  return {
    overview: { viewers, totalVisits: visits.reduce((total, visit) => total + safeCount(visit.visitCount), 0), totalActiveSeconds, averageActiveSeconds: viewers ? Math.round(totalActiveSeconds / viewers) : 0,
      completionRate: slides.length ? percent(slides.at(-1)?.viewers ?? 0, viewers) : 0, mostViewedSlide: mostViewed && mostViewed.viewers > 0 ? mostViewed.position : null },
    slides, sessions, legacyActivity: [...legacy.values()],
  }
}
