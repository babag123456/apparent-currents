/* eslint-disable @next/next/no-img-element */
import React from 'react'

import { getSafePublicHref } from '../../../lib/security/url'

interface MediaLike {
  alt?: string | null
  url?: string | null
}

interface ResultItem {
  value: string
  label: string
  id?: string | null
}

interface ImageItem {
  image: string | MediaLike
  id?: string | null
}

interface LinkItem {
  label: string
  url: string
  style?: 'outline' | 'text' | null
  id?: string | null
}

interface Props {
  client?: string | null
  headline: string
  body?: string | null
  resultColumns?: '2' | '3' | null
  results?: ResultItem[] | null
  links?: LinkItem[] | null
  images?: ImageItem[] | null
  imageLayout?: 'auto' | '2-col' | '3-col' | 'stack' | null
}

function getGridCols(count: number, layout: string | null | undefined): string {
  if (layout === '2-col') return 'grid-cols-1 sm:grid-cols-2'
  if (layout === '3-col') return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  if (layout === 'stack') return 'grid-cols-1'
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (count >= 3) return 'grid-cols-1 sm:grid-cols-2'
  return 'grid-cols-1 sm:grid-cols-2'
}

function isOddLastImage(index: number, count: number, layout: string | null | undefined): boolean {
  return count > 1 && count % 2 === 1 && index === count - 1 && layout !== 'stack' && layout !== '3-col'
}

function getImageItemClass(index: number, count: number, layout: string | null | undefined): string {
  if (!isOddLastImage(index, count, layout)) return 'overflow-hidden rounded-sm'

  return 'overflow-hidden rounded-sm sm:col-span-2'
}

export const EntryCaseStudyComponent: React.FC<Props> = ({ client, headline, body, resultColumns = '3', results, links, images, imageLayout }) => {
  const imgs = (images || []).filter((i) => i.image && typeof i.image === 'object') as { image: MediaLike; id?: string | null }[]
  const safeLinks = (links || [])
    .map((link) => ({ ...link, url: getSafePublicHref(link.url) }))
    .filter((link): link is LinkItem & { url: string } => Boolean(link.url))
  const resultColumnClass = resultColumns === '2' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-3'

  return (
    <section>
      <div className="mx-auto max-w-4xl px-6">
        {client && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red mb-3">
            {client}
          </p>
        )}
        <h2 className="font-sans text-3xl md:text-5xl font-[500] leading-[1.1] tracking-tight" style={{ color: 'var(--entry-text)' }}>
          {headline}
        </h2>
        {body && (
          <p className="mt-6 text-base md:text-lg font-[300] leading-relaxed whitespace-pre-line" style={{ color: 'var(--entry-muted)' }}>
            {body}
          </p>
        )}

        {results && results.length > 0 && (
          <div className={`mt-10 grid grid-cols-1 gap-8 ${resultColumnClass} md:gap-12`}>
            {results.map((r, i) => (
              <div key={r.id ?? i}>
                <p className="font-sans text-4xl md:text-5xl font-[500] tracking-tight" style={{ color: 'var(--entry-text)' }}>
                  {r.value}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] leading-relaxed break-words" style={{ color: 'var(--entry-muted)' }}>
                  {r.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {safeLinks.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-4">
            {safeLinks.map((link, i) => (
              <a
                key={link.id ?? i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  link.style === 'text'
                    ? 'font-mono text-sm text-red transition-opacity hover:opacity-70'
                    : 'font-mono text-sm border border-current px-4 py-2 rounded-sm transition-colors hover:bg-red hover:text-cream hover:border-red'
                }
                style={link.style !== 'text' ? { color: 'var(--entry-text)' } : undefined}
              >
                {link.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
        )}

        {imgs.length > 0 && (
          <div className={`mt-10 grid ${getGridCols(imgs.length, imageLayout)} gap-3`}>
            {imgs.map((item, i) => (
              <div key={item.id ?? i} className={getImageItemClass(i, imgs.length, imageLayout)}>
                <img
                  src={item.image.url!}
                  alt={item.image.alt || ''}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
