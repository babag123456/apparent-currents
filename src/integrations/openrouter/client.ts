/**
 * OpenRouter chat client — server-side only.
 *
 * The key is OPENROUTER_API_KEY in the environment: never exposed to the
 * browser, committed, stored in Payload data, returned via API responses,
 * or logged (the same rule as the Semrush key). Errors are mapped to
 * worded messages that never contain credentials or raw vendor payloads.
 *
 * The model is OPENROUTER_MODEL (an OpenRouter model slug, e.g.
 * "anthropic/claude-sonnet-4.5") — verify the slug against the current
 * OpenRouter model list; an unknown slug surfaces as a worded error, not
 * a silent fallback to some other model.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatResult =
  | { ok: true; answer: string; model: string }
  | { ok: false; message: string }

export function openRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY)
}

export function openRouterModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL
}

/** Map an HTTP failure to a worded, credential-free message. */
export function chatErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return 'OpenRouter rejected the key — check OPENROUTER_API_KEY and restart the app.'
    case 402:
      return 'The OpenRouter account has no credit — top up at openrouter.ai, then retry.'
    case 404:
      return `The model "${openRouterModel()}" was not found — set OPENROUTER_MODEL to a current OpenRouter slug.`
    case 429:
      return 'OpenRouter is rate-limiting this key — wait a moment and retry.'
    default:
      return `OpenRouter returned an unexpected error (HTTP ${status}) — retry, and check the account if it persists.`
  }
}

export async function chatComplete(messages: ChatMessage[]): Promise<ChatResult> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    return { ok: false, message: 'OpenRouter is not configured — add OPENROUTER_API_KEY to .env.' }
  }
  const model = openRouterModel()

  let response: Response
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'X-Title': 'Currents',
      },
      body: JSON.stringify({ model, messages, max_tokens: 700 }),
    })
  } catch {
    return { ok: false, message: 'Could not reach OpenRouter — check the network and retry.' }
  }

  if (!response.ok) {
    return { ok: false, message: chatErrorMessage(response.status) }
  }

  try {
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const answer = payload.choices?.[0]?.message?.content?.trim()
    if (!answer) {
      return { ok: false, message: 'OpenRouter returned an empty answer — retry.' }
    }
    return { ok: true, answer, model }
  } catch {
    return { ok: false, message: 'OpenRouter returned an unreadable response — retry.' }
  }
}
