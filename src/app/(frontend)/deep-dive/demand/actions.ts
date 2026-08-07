'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import config from '@payload-config'
import { canStartSync } from '../../../../intelligence/sync/status.ts'

export interface ImportActionResult {
  ok: boolean
  message: string
}

/**
 * Trigger one metered demand import for a context. Guarded three ways:
 * only an authenticated admin user may spend API units, duplicate runs are
 * refused (cooldown / already running), and the work itself runs as the
 * queued 'demand-sync' Payload job. The job records its own outcome on the
 * data-syncs collection — this action only reports how the trigger went.
 */
export async function importDemandEvidence(contextId: number): Promise<ImportActionResult> {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return {
      ok: false,
      message: 'Imports spend metered API units — sign in to the admin first, then retry.',
    }
  }

  const latest = await payload.find({
    collection: 'data-syncs',
    where: { context: { equals: contextId }, source: { equals: 'semrush' } },
    sort: '-startedAt',
    limit: 1,
  })
  const latestSync = latest.docs[0]
  const decision = canStartSync(
    latestSync
      ? {
          status: latestSync.status,
          startedAt: latestSync.startedAt,
          finishedAt: latestSync.finishedAt ?? null,
        }
      : null,
  )
  if (!decision.allowed) {
    const minutes = decision.retryInMs ? Math.ceil(decision.retryInMs / 60_000) : null
    return {
      ok: false,
      message:
        decision.reason === 'running'
          ? 'An import is already running for this context.'
          : `Fresh evidence was imported recently — refresh available in ~${minutes} min.`,
    }
  }

  await payload.jobs.queue({
    task: 'demand-sync',
    input: { contextId },
  })
  await payload.jobs.run()

  revalidatePath('/deep-dive/demand')
  revalidatePath('/surface')

  return { ok: true, message: 'Import finished — see the sync record below for the outcome.' }
}
