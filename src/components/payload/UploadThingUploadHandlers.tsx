'use client'

import { toast, useUploadHandlers } from '@payloadcms/ui'
import { genUploader } from 'uploadthing/client'
import { useEffect } from 'react'

import type { UploadRouter } from '@/app/api/uploadthing/core'

const { uploadFiles } = genUploader<UploadRouter>()

const MB = 1024 * 1024

function assertUploadSize(file: File, limitMB: number, label: string) {
  if (file.size <= limitMB * MB) return

  throw new Error(`${label} must be ${limitMB}MB or smaller. Please choose a smaller file and try again.`)
}

function getUploadUrl(upload: { ufsUrl?: string; url?: string }) {
  return upload.ufsUrl || upload.url
}

export function UploadThingUploadHandlers() {
  const { setUploadHandler } = useUploadHandlers()

  useEffect(() => {
    setUploadHandler({
      collectionSlug: 'media',
      handler: async ({ file, updateFilename }) => {
        assertUploadSize(file, 50, 'Media')

        try {
          const [upload] = await uploadFiles('mediaUploader', { files: [file] })
          const url = upload ? getUploadUrl(upload) : null

          if (!upload || !url) {
            throw new Error('Media upload failed. Please try again.')
          }

          updateFilename(upload.name || file.name)

          return {
            key: upload.key,
            mimeType: upload.type || file.type,
            name: upload.name || file.name,
            size: file.size,
            url,
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Media upload failed. Please try again.'
          toast.error(message)
          throw error
        }
      },
    })

    setUploadHandler({
      collectionSlug: 'videos',
      handler: async ({ file, updateFilename }) => {
        assertUploadSize(file, 100, 'Videos')

        try {
          const [upload] = await uploadFiles('videoUploader', { files: [file] })
          const url = upload ? getUploadUrl(upload) : null

          if (!upload || !url) {
            throw new Error('Video upload failed. Please try again.')
          }

          updateFilename(upload.name || file.name)

          return {
            key: upload.key,
            mimeType: upload.type || file.type,
            name: upload.name || file.name,
            size: file.size,
            url,
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Video upload failed. Please try again.'
          toast.error(message)
          throw error
        }
      },
    })
  }, [setUploadHandler])

  return null
}
