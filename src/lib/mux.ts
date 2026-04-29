import { loadAwardKitEnv } from './loadEnv'

loadAwardKitEnv()

type MuxAssetResponse = {
  data: {
    id: string
    playback_ids?: Array<{ id: string; policy: string }>
    status?: string
  }
}

function getMuxCredentials() {
  const tokenId =
    process.env.MUX_ACCESS_TOKEN_ID ||
    process.env.MUX_TOKEN_ID ||
    process.env.MUX_ENVIRONMENT_ID ||
    ''
  const tokenSecret =
    process.env.MUX_ACCESS_TOKEN_SECRET ||
    process.env.MUX_TOKEN_SECRET ||
    process.env.MUX_ENVIRONMENT_KEY ||
    ''

  if (!tokenId || !tokenSecret) {
    throw new Error(
      'Missing Mux credentials. Set MUX_ACCESS_TOKEN_ID / MUX_ACCESS_TOKEN_SECRET. MUX_TOKEN_ID / MUX_TOKEN_SECRET remain supported as aliases.',
    )
  }

  return { tokenId, tokenSecret }
}

async function muxRequest<T>(pathname: string, init?: RequestInit): Promise<T> {
  const { tokenId, tokenSecret } = getMuxCredentials()
  const response = await fetch(`https://api.mux.com${pathname}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '')
    const detail = responseBody ? `: ${responseBody.slice(0, 500)}` : ''

    throw new Error(`Mux request failed (${response.status} ${response.statusText}) for ${pathname}${detail}`)
  }

  return response.json() as Promise<T>
}

export async function createMuxAssetFromUrl(inputUrl: string) {
  const result = await muxRequest<MuxAssetResponse>('/video/v1/assets', {
    method: 'POST',
    body: JSON.stringify({
      input: [{ url: inputUrl }],
      playback_policy: ['public'],
    }),
  })

  const playbackId = result.data.playback_ids?.[0]?.id || null

  return {
    assetId: result.data.id,
    playbackId,
    status: result.data.status || 'preparing',
  }
}

export async function deleteMuxAsset(assetId?: null | string) {
  if (!assetId) return

  const { tokenId, tokenSecret } = getMuxCredentials()
  const response = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')}`,
    },
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`Mux delete failed (${response.status} ${response.statusText}) for asset ${assetId}`)
  }
}

export function getMuxPlaybackUrl(playbackId?: null | string) {
  if (!playbackId) return null
  return `https://stream.mux.com/${playbackId}.m3u8`
}

export function getMuxThumbnailUrl(playbackId?: null | string) {
  if (!playbackId) return null
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`
}
