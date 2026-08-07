'use client'

import React, { useEffect, useId, useRef, useState, useTransition } from 'react'

import type { AskResult, AskTurn } from '../../../../app/(frontend)/ask-actions.ts'

/**
 * "Ask the evidence" — a discreet conversational window over the stored
 * evidence. The affordance is the product's red circular action button,
 * fixed bottom-right; the panel keeps the terminal grammar. Every answer
 * is stamped AI INTERPRETATION · NOT EVIDENCE so machine reading never
 * passes for source data, and unusable states (unconfigured, signed out)
 * open honestly instead of hiding the control.
 */

const SUGGESTED_QUESTIONS = [
  'What is moving fastest, and how confident are we?',
  'Where is the brand absent that competitors are not?',
  'What cuts against the charging story?',
]

interface LogEntry {
  role: 'user' | 'assistant' | 'error'
  content: string
  model?: string
}

export function AskPanel({
  disabledReason,
  action,
}: {
  /** When set, asking is disabled and this reason is shown in the panel. */
  disabledReason?: string
  action: (history: AskTurn[], question: string) => Promise<AskResult>
}) {
  const [open, setOpen] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [draft, setDraft] = useState('')
  const [pending, startTransition] = useTransition()
  const panelId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [log, pending])

  const send = (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || pending || disabledReason) return
    const history: AskTurn[] = log
      .filter((entry): entry is LogEntry & { role: 'user' | 'assistant' } => entry.role !== 'error')
      .map((entry) => ({ role: entry.role, content: entry.content }))
    setLog((current) => [...current, { role: 'user', content: trimmed }])
    setDraft('')
    startTransition(async () => {
      const result = await action(history, trimmed)
      setLog((current) => [
        ...current,
        result.ok
          ? { role: 'assistant', content: result.answer, model: result.model }
          : { role: 'error', content: result.message },
      ])
    })
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          toggleRef.current?.focus()
        }
      }}
    >
      {open ? (
        <section
          id={panelId}
          aria-label="Ask the evidence"
          className="flex max-h-[70vh] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col border border-red/40 bg-cream shadow-[0_12px_32px_-12px_rgba(36,35,34,0.35)]"
        >
          <div className="border-b border-red/25 px-4 py-3">
            <p className="text-[15px] font-medium leading-none text-charcoal">Ask the evidence</p>
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-charcoal/70">
              AI interpretation over on-screen evidence · never source data
            </p>
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            className="min-h-[120px] flex-1 overflow-y-auto px-4 py-4"
          >
            {log.length === 0 ? (
              <div>
                <p className="text-[13px] leading-relaxed text-charcoal/70">
                  Ask in plain language — answers draw only on the currents, markers
                  and evidence this product already shows, and say so when they can’t.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      disabled={Boolean(disabledReason)}
                      onClick={() => send(question)}
                      className="rounded-full border border-charcoal/25 px-3 py-1 text-left text-[12px] leading-snug text-charcoal/80 transition-colors hover:border-red-text hover:text-red-text disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {log.map((entry, index) => (
                  <li key={index}>
                    {entry.role === 'user' ? (
                      <p className="text-[14px] font-medium leading-relaxed text-charcoal">
                        {entry.content}
                      </p>
                    ) : entry.role === 'assistant' ? (
                      <div>
                        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-charcoal/85">
                          {entry.content}
                        </p>
                        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-red-text">
                          AI interpretation · {entry.model} · not evidence
                        </p>
                      </div>
                    ) : (
                      <p
                        role="status"
                        className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-red-text"
                      >
                        {entry.content}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {pending ? (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-charcoal/70">
                Reading the evidence…
              </p>
            ) : null}
          </div>

          <form
            className="border-t border-red/25 px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
          >
            {disabledReason ? (
              <p className="mb-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-charcoal/70">
                {disabledReason}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={draft}
                disabled={Boolean(disabledReason)}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send(draft)
                  }
                }}
                placeholder="Ask the evidence anything…"
                aria-label="Question for the evidence"
                className="min-h-[44px] w-full resize-none border-b border-charcoal/25 bg-transparent pb-1 text-[13.5px] leading-relaxed text-charcoal placeholder:text-charcoal/45 focus:border-red-text focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={pending || Boolean(disabledReason) || !draft.trim()}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium leading-none transition-colors ${
                  pending || Boolean(disabledReason) || !draft.trim()
                    ? 'cursor-not-allowed border-charcoal/25 text-charcoal/40'
                    : 'border-red-text bg-red-text text-cream hover:bg-red'
                }`}
              >
                {pending ? '…' : 'Ask'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-red text-cream shadow-[0_8px_20px_-8px_rgba(250,5,0,0.55)] transition-colors hover:bg-red-text"
      >
        <span className="sr-only">{open ? 'Close ask the evidence' : 'Ask the evidence'}</span>
        {open ? (
          <svg viewBox="0 0 14 14" width={13} height={13} aria-hidden="true">
            <path
              d="M2.5 2.5 L11.5 11.5 M11.5 2.5 L2.5 11.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width={15} height={15} aria-hidden="true">
            <path
              d="M2.5 3.5 A1.5 1.5 0 0 1 4 2 H12 A1.5 1.5 0 0 1 13.5 3.5 V9 A1.5 1.5 0 0 1 12 10.5 H7 L4 13.5 V10.5 A1.5 1.5 0 0 1 2.5 9 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
