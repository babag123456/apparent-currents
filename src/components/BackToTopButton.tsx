'use client'

import React, { useEffect, useState } from 'react'

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      const sections = Array.from(document.querySelectorAll('main > section'))
      const thirdSection = sections[2] as HTMLElement | undefined
      const threshold = thirdSection ? thirdSection.offsetTop : window.innerHeight * 1.5

      setVisible(window.scrollY >= threshold)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [])

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-current bg-[var(--entry-bg)] font-mono text-lg leading-none text-[var(--entry-text)] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-red hover:text-cream max-sm:bottom-4 max-sm:right-4 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      ↑
    </button>
  )
}
