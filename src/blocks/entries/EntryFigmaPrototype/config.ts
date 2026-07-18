import type { Block } from 'payload'

import { validateFigmaPrototypeUrl } from '../../../lib/presentations/figma.ts'

export const EntryFigmaPrototype: Block = {
  slug: 'entryFigmaPrototype',
  interfaceName: 'EntryFigmaPrototypeBlock',
  labels: { singular: 'Figma Prototype', plural: 'Figma Prototypes' },
  fields: [
    { name: 'title', type: 'text', label: 'Accessible title' },
    { name: 'prototypeUrl', type: 'text', required: true, validate: validateFigmaPrototypeUrl },
    {
      name: 'interfaceStyle',
      type: 'select',
      required: true,
      defaultValue: 'minimal',
      options: [
        { label: 'Minimal', value: 'minimal' },
        { label: 'Full controls', value: 'full' },
      ],
    },
    {
      name: 'syncedFrames',
      type: 'array',
      admin: { hidden: true, readOnly: true },
      fields: [
        { name: 'nodeId', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'width', type: 'number', required: true },
        { name: 'height', type: 'number', required: true },
      ],
    },
    { name: 'figmaSyncedAt', type: 'date', admin: { hidden: true, readOnly: true } },
    { name: 'figmaSyncError', type: 'text', admin: { hidden: true, readOnly: true } },
  ],
}
