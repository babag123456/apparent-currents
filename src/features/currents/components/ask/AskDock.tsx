import { headers } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import config from '@payload-config'
import { askEvidence } from '../../../../app/(frontend)/ask-actions.ts'
import { openRouterConfigured } from '../../../../integrations/openrouter/client.ts'
import { AskPanel } from './AskPanel.tsx'

/**
 * Server half of "Ask the evidence": works out why asking might be
 * disabled (no OpenRouter key, no admin session) so the panel can open
 * with the reason worded instead of failing on first use. The server
 * action re-checks both gates on every call regardless.
 */
export async function AskDock() {
  let user = null
  try {
    const payload = await getPayload({ config })
    user = (await payload.auth({ headers: await headers() })).user
  } catch {
    // No database — the signed-out reason below still applies.
  }

  const disabledReason = !openRouterConfigured()
    ? 'Ask is not configured — add OPENROUTER_API_KEY to .env and restart the app.'
    : !user
      ? 'Sign in to the admin to ask — questions spend metered API credit.'
      : undefined

  return <AskPanel disabledReason={disabledReason} action={askEvidence} />
}
