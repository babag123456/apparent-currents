import type { TaskConfig } from 'payload'

import { runDemandSync } from './runDemandSync.ts'

/**
 * Payload job task wrapping the demand sync runner. Queued (and currently
 * also run) from the Deep Dive import action; registering it as a task
 * keeps ingestion decoupled from page rendering and ready for scheduled
 * refresh later without restructuring.
 */
export const demandSyncTask: TaskConfig<'demand-sync'> = {
  slug: 'demand-sync',
  retries: 0,
  inputSchema: [
    {
      name: 'contextId',
      type: 'number',
      required: true,
    },
  ],
  outputSchema: [
    { name: 'status', type: 'text', required: true },
    { name: 'syncId', type: 'number', required: true },
    { name: 'estimatedUnits', type: 'number' },
  ],
  handler: async ({ input, req }) => {
    const result = await runDemandSync({
      payload: req.payload,
      contextId: Number(input.contextId),
    })
    return {
      output: {
        status: result.status,
        syncId: result.syncId,
        estimatedUnits: result.estimatedUnits,
      },
    }
  },
}
