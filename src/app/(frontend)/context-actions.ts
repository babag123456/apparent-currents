'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import config from '@payload-config'

export interface RefineContextResult {
  ok: boolean
  message: string
}

const MAX_FIELD = 200
const MAX_AUDIENCE = 500
const MAX_COMPETITORS = 10

/**
 * Update the analysis context from the bar's refine form. Auth-gated the
 * same way as metered imports: the action checks for an admin session and
 * the update also runs with access control enforced (overrideAccess:
 * false), so the collection's rules hold even if this action is called
 * outside the form. Only the frame fields are editable here — topic seed
 * phrases and the Semrush database stay in the admin, because they change
 * what an import spends.
 */
export async function refineContext(
  _prev: RefineContextResult | null,
  formData: FormData,
): Promise<RefineContextResult> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) {
    return {
      ok: false,
      message: 'Editing the context needs an admin session — sign in to the admin, then retry.',
    }
  }

  const contextId = Number(formData.get('contextId'))
  if (!Number.isInteger(contextId)) {
    return { ok: false, message: 'Missing context id — reload the page and retry.' }
  }

  const text = (name: string, max = MAX_FIELD) =>
    String(formData.get(name) ?? '')
      .trim()
      .slice(0, max)

  const brand = text('brand')
  const market = text('market')
  if (!brand || !market) {
    return { ok: false, message: 'Brand and market are required — they frame every finding.' }
  }
  const category = text('category')
  const audience = text('audience', MAX_AUDIENCE)
  const competitors = text('competitors', 400)
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPETITORS)

  try {
    await payload.update({
      collection: 'contexts',
      id: contextId,
      data: {
        brand,
        market,
        category: category || null,
        audience: audience || null,
        competitors: competitors.map((name) => ({ name })),
      },
      user,
      overrideAccess: false,
    })
  } catch {
    return { ok: false, message: 'The update was refused — check the admin session and retry.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true, message: 'Context updated.' }
}
