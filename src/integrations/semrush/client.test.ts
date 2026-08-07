import { afterEach, describe, expect, it, vi } from 'vitest'

import { SemrushApiError, SemrushClient, SemrushConfigError } from './client.ts'

function mockFetch(body: string, status = 200): typeof fetch {
  return vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch
}

const KEY = 'test-key-not-real'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('SemrushClient configuration', () => {
  it('throws a config error when no API key is available', () => {
    vi.stubEnv('SEMRUSH_API_KEY', '')
    expect(() => new SemrushClient()).toThrow(SemrushConfigError)
  })

  it('accepts an explicit key', () => {
    expect(() => new SemrushClient({ apiKey: KEY })).not.toThrow()
  })
})

describe('SemrushClient.fetchReport', () => {
  it('parses a CSV response and estimates unit spend', async () => {
    const body = 'Keyword;Search Volume\nev charging;12100\nev charger;8100'
    const client = new SemrushClient({ apiKey: KEY, fetchImpl: mockFetch(body) })

    const result = await client.fetchReport('phrase_these', { phrase: 'x' }, 'au')

    expect(result.rows).toHaveLength(2)
    expect(result.estimatedUnits).toBe(20) // 2 lines × 10 units
    expect(result.database).toBe('au')
  })

  it('treats ERROR 50 NOTHING FOUND as an empty result', async () => {
    const client = new SemrushClient({
      apiKey: KEY,
      fetchImpl: mockFetch('ERROR 50 :: NOTHING FOUND'),
    })

    const result = await client.fetchReport('phrase_related', { phrase: 'x' }, 'au')
    expect(result.rows).toEqual([])
    expect(result.estimatedUnits).toBe(0)
  })

  it('throws a typed error for other ERROR bodies without echoing the key', async () => {
    const client = new SemrushClient({
      apiKey: KEY,
      fetchImpl: mockFetch('ERROR 120 :: WRONG KEY - ID PAIR'),
    })

    const error = await client
      .fetchReport('phrase_these', { phrase: 'x' }, 'au')
      .then(() => null)
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(SemrushApiError)
    expect((error as SemrushApiError).code).toBe(120)
    expect((error as Error).message).not.toContain(KEY)
  })

  it('extracts the error code when an ERROR body arrives over HTTP 403 (e.g. zero unit balance)', async () => {
    const client = new SemrushClient({
      apiKey: KEY,
      fetchImpl: mockFetch('ERROR 132 :: API UNITS BALANCE IS ZERO', 403),
    })

    await expect(client.fetchReport('phrase_these', { phrase: 'x' }, 'au')).rejects.toMatchObject({
      name: 'SemrushApiError',
      code: 132,
      httpStatus: 403,
    })
  })

  it('throws on non-2xx HTTP responses', async () => {
    const client = new SemrushClient({ apiKey: KEY, fetchImpl: mockFetch('oops', 500) })

    await expect(client.fetchReport('phrase_these', { phrase: 'x' }, 'au')).rejects.toMatchObject({
      name: 'SemrushApiError',
      httpStatus: 500,
    })
  })

  it('wraps network failures in a typed error', async () => {
    const failingFetch = vi.fn(async () => {
      throw new Error('socket hang up')
    }) as unknown as typeof fetch
    const client = new SemrushClient({ apiKey: KEY, fetchImpl: failingFetch })

    await expect(client.fetchReport('phrase_these', { phrase: 'x' }, 'au')).rejects.toThrow(
      SemrushApiError,
    )
  })

  it('sends type, database and params in the request URL', async () => {
    const fetchImpl = mockFetch('Keyword;Search Volume\nseo;1')
    const client = new SemrushClient({ apiKey: KEY, fetchImpl })

    await client.fetchReport('phrase_these', { phrase: 'a;b', export_columns: 'Ph,Nq' }, 'us')

    const requestedUrl = new URL((fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0][0] as string)
    expect(requestedUrl.origin).toBe('https://api.semrush.com')
    expect(requestedUrl.searchParams.get('type')).toBe('phrase_these')
    expect(requestedUrl.searchParams.get('database')).toBe('us')
    expect(requestedUrl.searchParams.get('phrase')).toBe('a;b')
    expect(requestedUrl.searchParams.get('export_columns')).toBe('Ph,Nq')
  })
})
