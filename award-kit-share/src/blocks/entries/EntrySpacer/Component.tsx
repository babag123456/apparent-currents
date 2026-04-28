import React from 'react'

interface Props {
  size: 'sm' | 'md' | 'lg'
}

const sizeClass: Record<string, string> = {
  sm: 'h-8 md:h-12',
  md: 'h-16 md:h-24',
  lg: 'h-24 md:h-40',
}

export const EntrySpacerComponent: React.FC<Props> = ({ size = 'md' }) => {
  return <div className={sizeClass[size] || sizeClass.md} aria-hidden />
}
