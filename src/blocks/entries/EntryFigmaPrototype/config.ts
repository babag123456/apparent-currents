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
  ],
}
