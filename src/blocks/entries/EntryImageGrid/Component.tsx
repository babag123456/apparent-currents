/* eslint-disable @next/next/no-img-element */
import React from 'react'

interface MediaLike {
  alt?: string | null
  url?: string | null
}

interface ImageItem {
  image: string | MediaLike
  caption?: string | null
  id?: string | null
}

interface Props {
  images: ImageItem[]
  columns?: 'auto' | '2' | '3' | null
}

export const EntryImageGridComponent: React.FC<Props> = ({ images, columns = 'auto' }) => {
  if (!images?.length) return null

  const validImages = images.filter((i) => i.image && typeof i.image === 'object') as { image: MediaLike; caption?: string | null; id?: string | null }[]
  if (!validImages.length) return null

  const colClass =
    columns === '2' ? 'grid-cols-1 sm:grid-cols-2'
    : columns === '3' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : validImages.length === 1 ? 'grid-cols-1'
    : validImages.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="py-8">
      <div className="mx-auto max-w-5xl px-6">
        <div className={`grid ${colClass} gap-3`}>
          {validImages.map((item, i) => (
            <figure key={item.id ?? i}>
              <div className="overflow-hidden rounded-sm">
                <img
                  src={item.image.url!}
                  alt={item.image.alt || ''}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              {item.caption && (
                <figcaption className="mt-2 font-mono text-[11px] tracking-wide" style={{ color: 'var(--entry-muted)' }}>
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
