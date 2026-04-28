import React from 'react'

interface MediaLike {
  alt?: string | null
  playbackUrl?: string | null
  thumbnailUrl?: string | null
  url?: string | null
}

interface Props {
  video: string | MediaLike
  poster?: string | MediaLike | null
  caption?: string | null
}

export const EntryVideoComponent: React.FC<Props> = ({ video, poster, caption }) => {
  const vid = typeof video === 'object' ? video : null
  const videoUrl = vid?.playbackUrl || vid?.url
  if (!videoUrl) return null

  const posterImg = poster && typeof poster === 'object' ? poster : null

  return (
    <section className="py-8">
      <div className="mx-auto max-w-4xl px-6">
        <video
          src={videoUrl}
          poster={posterImg?.url || vid?.thumbnailUrl || undefined}
          controls
          playsInline
          className="w-full rounded-sm"
        />
        {caption && (
          <p className="mt-3 font-mono text-[11px] tracking-wide" style={{ color: 'var(--entry-muted)' }}>{caption}</p>
        )}
      </div>
    </section>
  )
}
