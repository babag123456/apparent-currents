import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { chatComplete, chatErrorMessage, openRouterModel } from './client.ts'

describe('chatErrorMessage', () => {
  it('words auth, credit, model and rate-limit failures distinctly', () => {
    expect(chatErrorMessage(401)).toMatch(/OPENROUTER_API_KEY/)
    expect(chatErrorMessage(402)).toMatch(/no credit/)
    expect(chatErrorMessage(404)).toMatch(/OPENROUTER_MODEL/)
    expect(chatErrorMessage(429)).toMatch(/rate-limiting/)
    expect(chatErrorMessage(500)).toMatch(/HTTP 500/)
  })

  it('never leaks a key into a message', () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test-secret'
    for (const status of [401, 402, 404, 429, 500]) {
      expect(chatErrorMessage(status)).not.toContain('sk-or-test-secret')
    }
    delete process.env.OPENROUTER_API_KEY
  })
})

describe('chatComplete', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test-secret'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    delete process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_MODEL
  })

  it('refuses with a worded message when unconfigured', async () => {
    delete process.env.OPENROUTER_API_KEY
    const result = await chatComplete([{ role: 'user', content: 'hi' }])
    expect(result).toEqual({
      ok: false,
      message: 'OpenRouter is not configured — add OPENROUTER_API_KEY to .env.',
    })
  })

  it('returns the answer and model on success', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: '  An answer.  ' } }] }),
        { status: 200 },
      ),
    ) as typeof fetch
    const result = await chatComplete([{ role: 'user', content: 'hi' }])
    expect(result).toEqual({ ok: true, answer: 'An answer.', model: openRouterModel() })
  })

  it('maps HTTP failures to worded messages', async () => {
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 402 })) as typeof fetch
    const result = await chatComplete([{ role: 'user', content: 'hi' }])
    expect(result).toEqual({ ok: false, message: chatErrorMessage(402) })
  })

  it('treats an empty completion as a failure, not an empty answer', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    ) as typeof fetch
    const result = await chatComplete([{ role: 'user', content: 'hi' }])
    expect(result.ok).toBe(false)
  })

  it('handles network failure without throwing', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('offline')
    }) as typeof fetch
    const result = await chatComplete([{ role: 'user', content: 'hi' }])
    expect(result).toEqual({
      ok: false,
      message: 'Could not reach OpenRouter — check the network and retry.',
    })
  })

  it('respects OPENROUTER_MODEL', () => {
    process.env.OPENROUTER_MODEL = 'test/custom-model'
    expect(openRouterModel()).toBe('test/custom-model')
  })
})
