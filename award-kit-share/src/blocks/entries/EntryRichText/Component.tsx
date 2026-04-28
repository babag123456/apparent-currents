import React from 'react'
import RichText from '../../../components/RichText'

interface Props {
  richText: any
  maxWidth?: 'narrow' | 'medium' | 'full' | null
}

const widthClass: Record<string, string> = {
  narrow: 'max-w-2xl',
  medium: 'max-w-4xl',
  full: 'max-w-6xl',
}

export const EntryRichTextComponent: React.FC<Props> = ({ richText, maxWidth = 'narrow' }) => {
  if (!richText) return null

  return (
    <section className="py-10">
      <div className={`mx-auto ${widthClass[maxWidth ?? 'narrow']} px-6`}>
        <RichText
          data={richText}
          enableGutter={false}
          enableProse={false}
          className="entry-richtext"
        />
      </div>
    </section>
  )
}
