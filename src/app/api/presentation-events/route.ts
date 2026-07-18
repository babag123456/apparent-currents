import { parsePresentationEvent } from '../../../lib/presentations/analytics'
import { isValidPresentationShareToken } from '../../../lib/presentations/shareToken'
import { recordPresentationEvent } from '../../../lib/presentations/repository'

const MAX_BODY_BYTES = 4096
const headers = { 'Cache-Control': 'no-store' }

export async function POST(request: Request): Promise<Response> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_BODY_BYTES) return new Response(null, { status: 413, headers })

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return new Response(null, { status: 413, headers })

  let body: unknown
  try { body = JSON.parse(text) } catch { return new Response(null, { status: 400, headers }) }
  if (!body || typeof body !== 'object') return new Response(null, { status: 400, headers })

  const value = body as { shareToken?: unknown; event?: unknown }
  if (typeof value.shareToken !== 'string' || !isValidPresentationShareToken(value.shareToken)) {
    return new Response(null, { status: 404, headers })
  }
  const event = parsePresentationEvent(value.event)
  if (!event) return new Response(null, { status: 400, headers })

  try {
    const result = await recordPresentationEvent({
      shareToken: value.shareToken,
      event,
      userAgent: request.headers.get('user-agent') ?? '',
    })
    return new Response(null, { status: result === 'recorded' ? 202 : 404, headers })
  } catch (error) {
    console.error('Presentation analytics failed.', error)
    return new Response(null, { status: 202, headers })
  }
}
