'use client'

import React from 'react'
import { useEntryTheme } from './EntryThemeProvider'

const SunIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.8" />
    <line x1="8" y1="1.5" x2="8" y2="3" />
    <line x1="8" y1="13" x2="8" y2="14.5" />
    <line x1="1.5" y1="8" x2="3" y2="8" />
    <line x1="13" y1="8" x2="14.5" y2="8" />
    <line x1="3.4" y1="3.4" x2="4.5" y2="4.5" />
    <line x1="11.5" y1="11.5" x2="12.6" y2="12.6" />
    <line x1="12.6" y1="3.4" x2="11.5" y2="4.5" />
    <line x1="4.5" y1="11.5" x2="3.4" y2="12.6" />
  </svg>
)

const MoonIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 8.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7z" />
  </svg>
)

export const EntryThemeToggle: React.FC = () => {
  const { theme, toggle } = useEntryTheme()

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="fixed top-5 right-5 z-[100] flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/30 text-cream shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
      style={{
        color: 'var(--color-cream)',
      }}
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
