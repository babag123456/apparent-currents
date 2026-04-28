'use client'

import { useEffect, useState } from 'react'

const WORDS = ['agency', 'passion', 'energy'] as const
const TYPING_DELAY_MS = 124
const HOLD_DELAY_MS = 5000
const DELETE_DELAY_MS = 72

export function RotatingWordmark() {
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = WORDS[wordIndex]

    const timer = window.setTimeout(() => {
      if (!isDeleting && displayed === currentWord) {
        setIsDeleting(true)
        return
      }

      if (!isDeleting) {
        const next = currentWord.slice(0, displayed.length + 1)
        setDisplayed(next)
        return
      }

      const next = currentWord.slice(0, Math.max(displayed.length - 1, 0))
      setDisplayed(next)

      if (next.length === 0) {
        setIsDeleting(false)
        setWordIndex((index) => (index + 1) % WORDS.length)
      }
    }, !isDeleting && displayed === currentWord ? HOLD_DELAY_MS : isDeleting ? DELETE_DELAY_MS : TYPING_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [displayed, isDeleting, wordIndex])

  return (
    <span className="wordmark-rotating" aria-live="polite" aria-atomic="true">
      <span className="wordmark-rotating-sizer" aria-hidden="true">
        passion
      </span>
      <span className="wordmark-rotating-text">
        <span className="wordmark-rotating-value">{displayed}</span>
        <span className="wordmark-caret" aria-hidden="true" />
      </span>
    </span>
  )
}
