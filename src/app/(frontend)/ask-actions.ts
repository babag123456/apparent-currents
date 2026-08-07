'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getEvidenceDigest } from '../../features/currents/queries/getEvidenceDigest.ts'
import {
  chatComplete,
  openRouterConfigured,
  type ChatMessage,
} from '../../integrations/openrouter/client.ts'

export interface AskTurn {
  role: 'user' | 'assistant'
  content: string
}

export type AskResult =
  | { ok: true; answer: string; model: string }
  | { ok: false; message: string }

const MAX_TURNS = 12
const MAX_TURN_CHARS = 4_000
const MAX_QUESTION_CHARS = 1_000

const SYSTEM_PROMPT =
  'You are the analyst interface for Currents, an audience-intent intelligence ' +
  'product. Answer questions ONLY from the evidence digest below — never from ' +
  'general knowledge. Reference current IDs (C1…) and name sources when you make ' +
  'a claim. When the digest cannot answer, say so plainly and name which source ' +
  'or dataset would. Most of the digest is authored synthetic fixture data — say ' +
  'so when it matters. Use the product language: markers (individual signals), ' +
  'currents (patterns across markers), opportunities (authored convergences; ' +
  'statuses are emerging/accelerating/established/declining). You interpret ' +
  'evidence; you never invent it, and you never present interpretation as data. ' +
  'Keep answers under 150 words unless the question truly needs more.'

/**
 * One grounded Q&A turn for "Ask the evidence". Admin-gated like every
 * spend: questions cost OpenRouter credit, so an anonymous session gets a
 * worded refusal, not a quiet one. The model sees exactly what the pages
 * show (the digest), so answers stay traceable to on-screen evidence.
 */
export async function askEvidence(history: AskTurn[], question: string): Promise<AskResult> {
  if (!openRouterConfigured()) {
    return {
      ok: false,
      message:
        'Ask is not configured — add OPENROUTER_API_KEY (and optionally OPENROUTER_MODEL) to .env and restart.',
    }
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return {
      ok: false,
      message: 'Questions spend metered API credit — sign in to the admin first, then retry.',
    }
  }

  const trimmedQuestion = question.trim().slice(0, MAX_QUESTION_CHARS)
  if (!trimmedQuestion) {
    return { ok: false, message: 'Ask something — the box was empty.' }
  }
  const safeHistory: ChatMessage[] = history
    .filter((turn) => turn.role === 'user' || turn.role === 'assistant')
    .slice(-MAX_TURNS)
    .map((turn) => ({ role: turn.role, content: String(turn.content).slice(0, MAX_TURN_CHARS) }))

  const digest = await getEvidenceDigest()

  return chatComplete([
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n=== EVIDENCE DIGEST ===\n${digest}` },
    ...safeHistory,
    { role: 'user', content: trimmedQuestion },
  ])
}
