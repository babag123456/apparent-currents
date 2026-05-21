import React from 'react'

interface Props {
  color?: 'subtle' | 'red' | 'charcoal' | null
}

export const EntryDividerComponent: React.FC<Props> = ({ color = 'subtle' }) => {
  const borderStyle = color === 'red' ? { borderColor: 'var(--color-red)' }
    : color === 'charcoal' ? { borderColor: 'var(--color-charcoal)' }
    : { borderColor: 'var(--entry-subtle)' }

  return (
    <div className="mx-auto max-w-4xl px-6">
      <hr className="border-t" style={borderStyle} />
    </div>
  )
}
