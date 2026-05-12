import React from 'react'

interface MediaLike {
  alt?: string | null
  playbackUrl?: string | null
  thumbnailUrl?: string | null
  url?: string | null
}

interface Props {
  source?: 'upload' | 'vimeo' | null
  video?: string | MediaLike | null
  videoUrl?: string | null
  poster?: string | MediaLike | null
  caption?: string | null
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (!match) return null
  return `https://player.vimeo.com/video/${match[1]}?title=0&byline=0&portrait=0`
}

export const EntryVideoComponent: React.FC<Props> = ({ source, video, videoUrl, poster, caption }) => {
  const posterImg = poster && typeof poster === 'object' ? poster : null

  const isVimeo = source === 'vimeo' || (!source && videoUrl)
  const embedUrl = isVimeo && videoUrl ? getVimeoEmbedUrl(videoUrl) : null

  const vid = video && typeof video === 'object' ? video : null
  const uploadUrl = vid?.playbackUrl || vid?.url

  if (!embedUrl && !uploadUrl) return null

  return (
    <section className="py-8">
      <div className="mx-auto max-w-4xl px-6">
        {embedUrl ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full rounded-sm"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            src={uploadUrl!}
            poster={posterImg?.url || vid?.thumbnailUrl || undefined}
            controls
            playsInline
            className="w-full rounded-sm"
          />
        )}
        {caption && (
          <p className="mt-3 font-mono text-[11px] tracking-wide" style={{ color: 'var(--entry-muted)' }}>{caption}</p>
        )}
      </div>
    </section>
  )
}
