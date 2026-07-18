const MAX_ACTIVE_SECONDS = 31_536_000
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LINK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/
const BLOCK_VALUE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export type DeviceCategory = 'desktop' | 'mobile' | 'tablet' | 'unknown'

export type PresentationEvent =
  | { type: 'open'; sessionId: string }
  | { type: 'heartbeat'; sessionId: string; activeSeconds: number }
  | { type: 'linkClick'; sessionId: string; linkId: string }
  | { type: 'blockHeartbeat'; sessionId: string; blockId: string; blockType: string; displayMode: 'scroll' | 'slideshow'; activeSeconds: number }
  | { type: 'slideNavigation'; sessionId: string; blockId: string; blockType: string; displayMode: 'slideshow' }

type VisitMetricEvent =
  | { type: 'open' }
  | { type: 'heartbeat'; activeSeconds: number }
  | { type: 'linkClick' }

export type VisitMetrics = {
  activeSeconds: number
  visitCount: number
  lastSeenAt: Date
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parsePresentationEvent(value: unknown): PresentationEvent | null {
  if (!isRecord(value) || typeof value.sessionId !== 'string' || !SESSION_ID_PATTERN.test(value.sessionId)) {
    return null
  }

  const allowedKeys: Record<string, string[]> = {
    open: ['type', 'sessionId'],
    heartbeat: ['type', 'sessionId', 'activeSeconds'],
    linkClick: ['type', 'sessionId', 'linkId'],
    blockHeartbeat: ['type', 'sessionId', 'blockId', 'blockType', 'displayMode', 'activeSeconds'],
    slideNavigation: ['type', 'sessionId', 'blockId', 'blockType', 'displayMode'],
  }
  const eventType = typeof value.type === 'string' ? value.type : null
  if (!eventType || !allowedKeys[eventType] || Object.keys(value).some((key) => !allowedKeys[eventType].includes(key))) return null

  if (value.type === 'open') {
    return { type: 'open', sessionId: value.sessionId }
  }

  if (
    value.type === 'heartbeat' &&
    Number.isInteger(value.activeSeconds) &&
    typeof value.activeSeconds === 'number' &&
    value.activeSeconds >= 1 &&
    value.activeSeconds <= 30
  ) {
    return {
      type: 'heartbeat',
      sessionId: value.sessionId,
      activeSeconds: value.activeSeconds,
    }
  }

  if (value.type === 'linkClick' && typeof value.linkId === 'string' && LINK_ID_PATTERN.test(value.linkId)) {
    return { type: 'linkClick', sessionId: value.sessionId, linkId: value.linkId }
  }

  const validBlock = typeof value.blockId === 'string' && BLOCK_VALUE_PATTERN.test(value.blockId) &&
    typeof value.blockType === 'string' && BLOCK_VALUE_PATTERN.test(value.blockType) &&
    (value.displayMode === 'scroll' || value.displayMode === 'slideshow')
  if (value.type === 'blockHeartbeat' && validBlock && typeof value.activeSeconds === 'number' &&
    Number.isInteger(value.activeSeconds) && value.activeSeconds >= 1 && value.activeSeconds <= 30) {
    return { type: value.type, sessionId: value.sessionId, blockId: value.blockId as string,
      blockType: value.blockType as string, displayMode: value.displayMode as 'scroll' | 'slideshow', activeSeconds: value.activeSeconds }
  }
  if (value.type === 'slideNavigation' && validBlock && value.displayMode === 'slideshow') {
    return { type: value.type, sessionId: value.sessionId, blockId: value.blockId as string,
      blockType: value.blockType as string, displayMode: 'slideshow' }
  }

  return null
}

export function classifyDevice(userAgent: string): DeviceCategory {
  if (!userAgent.trim()) return 'unknown'
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 'tablet'
  if (/Mobile|iPhone|iPod|Android/i.test(userAgent)) return 'mobile'
  if (/Mozilla|Windows|Macintosh|Linux/i.test(userAgent)) return 'desktop'
  return 'unknown'
}

export function mergeVisitMetrics(
  current: VisitMetrics,
  event: VisitMetricEvent,
  now: Date,
): VisitMetrics {
  const activeIncrement = event.type === 'heartbeat' ? event.activeSeconds : 0

  return {
    activeSeconds: Math.min(MAX_ACTIVE_SECONDS, Math.max(0, current.activeSeconds) + activeIncrement),
    visitCount: Math.max(0, current.visitCount) + (event.type === 'open' ? 1 : 0),
    lastSeenAt: now,
  }
}
