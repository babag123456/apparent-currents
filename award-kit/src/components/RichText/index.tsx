import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { RichText as ConvertRichText } from '@payloadcms/richtext-lexical/react'

type Props = {
  data: DefaultTypedEditorState
  className?: string
  enableGutter?: boolean
  enableProse?: boolean
}

export default function RichText({ data, className }: Props) {
  return <ConvertRichText className={className} data={data} />
}
