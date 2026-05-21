import type { CollectionBeforeChangeHook, TypeWithID } from 'payload'
import { ValidationError } from 'payload'

const BYTES_PER_MB = 1024 * 1024

type LimitUploadSizeArgs = {
  collectionLabel: string
  limitMB: number
}

function formatFileSize(bytes: number): string {
  return `${(bytes / BYTES_PER_MB).toFixed(1)}MB`
}

export function limitUploadSize<T extends TypeWithID>({
  collectionLabel,
  limitMB,
}: LimitUploadSizeArgs): CollectionBeforeChangeHook<T> {
  return ({ data, req }) => {
    const file = req.file
    if (!file) return data

    const maxBytes = limitMB * BYTES_PER_MB
    if (file.size <= maxBytes) return data

    throw new ValidationError(
      {
        collection: collectionLabel,
        errors: [
          {
            label: 'File',
            message: `${collectionLabel} uploads must be ${limitMB}MB or smaller. "${file.name}" is ${formatFileSize(file.size)}.`,
            path: 'file',
          },
        ],
        req,
      },
      req.t,
    )
  }
}
