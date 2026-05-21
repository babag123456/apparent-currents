import type { CollectionBeforeChangeHook, TypeWithID } from 'payload'
import { ValidationError } from 'payload'

import { getDirectUploadThingContext } from './uploadthing.ts'

const BYTES_PER_MB = 1024 * 1024

type LimitUploadSizeArgs = {
  collectionLabel: string
  limitMB: number
  skipClientUpload?: boolean
}

function formatFileSize(bytes: number): string {
  return `${(bytes / BYTES_PER_MB).toFixed(1)}MB`
}

function getUploadSize(file: {
  clientUploadContext?: unknown
  size?: number
}) {
  if (typeof file.size === 'number' && Number.isFinite(file.size)) {
    return file.size
  }

  const directUpload = getDirectUploadThingContext(file)

  return directUpload?.size
}

export function limitUploadSize<T extends TypeWithID>({
  collectionLabel,
  limitMB,
  skipClientUpload,
}: LimitUploadSizeArgs): CollectionBeforeChangeHook<T> {
  return ({ data, req }) => {
    const file = req.file
    if (!file) return data
    if (skipClientUpload && file.clientUploadContext) return data

    const fileSize = getUploadSize(file)
    if (typeof fileSize !== 'number') return data

    const maxBytes = limitMB * BYTES_PER_MB
    if (fileSize <= maxBytes) return data

    throw new ValidationError(
      {
        collection: collectionLabel,
        errors: [
          {
            label: 'File',
            message: `${collectionLabel} uploads must be ${limitMB}MB or smaller. "${file.name}" is ${formatFileSize(fileSize)}.`,
            path: 'file',
          },
        ],
        req,
      },
      req.t,
    )
  }
}

export function getDirectUploadLimitMB() {
  if (process.env.PAYLOAD_DIRECT_UPLOAD_LIMIT_MB) {
    return Number(process.env.PAYLOAD_DIRECT_UPLOAD_LIMIT_MB)
  }

  if (process.env.VERCEL) {
    return 4
  }

  return null
}
