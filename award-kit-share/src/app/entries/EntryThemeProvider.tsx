'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type EntryTheme = 'light' | 'dark'

const EntryThemeContext = createContext<{
  theme: EntryTheme
  toggle: () => void
}>({ theme: 'light', toggle: () => {} })

export const useEntryTheme = () => useContext(EntryThemeContext)

export const EntryThemeProvider: React.FC<{
  initialTheme: EntryTheme
  children: React.ReactNode
}> = ({ initialTheme, children }) => {
  const [theme, setTheme] = useState<EntryTheme>(initialTheme)
  const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])

  return (
    <EntryThemeContext.Provider value={{ theme, toggle }}>
      <div
        className="min-h-screen transition-colors duration-300"
        data-entry-theme={theme}
        style={{
          '--entry-bg': theme === 'dark' ? 'var(--color-charcoal)' : '#ffffff',
          '--entry-text': theme === 'dark' ? 'var(--color-cream)' : 'var(--color-charcoal)',
          '--entry-muted': theme === 'dark' ? 'rgba(247,244,242,0.5)' : 'rgba(35,35,34,0.5)',
          '--entry-subtle': theme === 'dark' ? 'rgba(247,244,242,0.07)' : 'rgba(35,35,34,0.1)',
          backgroundColor: 'var(--entry-bg)',
          color: 'var(--entry-text)',
        } as React.CSSProperties}
      >
        {children}
      </div>
    </EntryThemeContext.Provider>
  )
}
