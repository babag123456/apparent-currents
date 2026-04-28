# DESIGN.md

> This file is the single source of truth for visual and design decisions on this project.
> All contributors and AI tools should consult it before producing UI or design work.

---

## Brand Colours

Define your full palette here. Use semantic naming alongside raw values.

```
Primary:      #______   – [describe usage, e.g. CTAs, key highlights]
Secondary:    #______   – [describe usage, e.g. supporting accents]
Background:   #______   – [main page/app background]
Surface:      #______   – [cards, panels, modals]
Text:         #______   – [primary body text]
Text Muted:   #______   – [secondary text, captions, placeholders]
Border:       #______   – [dividers, input outlines]
Error:        #______
Success:      #______
Warning:      #______
```

**Colour rules:**
- [e.g. Never use Primary on a dark background without sufficient contrast]
- [e.g. Gradients are allowed only between Primary and Secondary]
- [e.g. Accent colour is reserved for interactive elements only]

---

## Typography

### Typefaces

| Role          | Font Family         | Weight(s)       | Notes                         |
|---------------|---------------------|-----------------|-------------------------------|
| Display / H1  | [Font Name]         | 700, 800        | [e.g. Use for hero headings]  |
| Heading       | [Font Name]         | 600             | [e.g. H2–H4]                  |
| Body          | [Font Name]         | 400, 500        | [e.g. All paragraph text]     |
| Mono / Code   | [Font Name]         | 400             | [e.g. Code blocks, numbers]   |
| Label / UI    | [Font Name]         | 500, 600        | [e.g. Buttons, nav, tags]     |

### Scale

```
xs:   0.75rem  / 12px
sm:   0.875rem / 14px
base: 1rem     / 16px
lg:   1.125rem / 18px
xl:   1.25rem  / 20px
2xl:  1.5rem   / 24px
3xl:  1.875rem / 30px
4xl:  2.25rem  / 36px
5xl:  3rem     / 48px
6xl:  3.75rem  / 60px
```

### Rules
- Line height: `1.5` for body, `1.1–1.2` for display headings
- Letter spacing: [e.g. Tight on large headings (–0.02em), normal on body]
- [e.g. All-caps usage: labels and eyebrow text only]

---

## Aesthetic Direction

**Overall style:** [Choose one or combine: Minimal · Bold · Editorial · Brutalist · Soft / Organic · Luxury · Playful · Industrial · Retro-futuristic · Corporate clean]

**In a sentence:** [e.g. "Clean, editorial confidence — lots of white space, strong typographic hierarchy, restrained colour."]

**Mood board keywords:** [e.g. crisp, considered, premium, warm, monochrome, structured]

### Layout principles
- [e.g. Generous whitespace — never cramped]
- [e.g. Asymmetry is encouraged in hero sections; symmetry in grids]
- [e.g. Max content width: 1280px, standard content column: 720px]
- [e.g. 8px base grid; all spacing in multiples of 4px or 8px]

### Imagery & illustration style
- [e.g. Photography: high-contrast, desaturated, always real people]
- [e.g. Icons: 1.5px stroke, rounded caps, from Lucide]
- [e.g. Illustrations: flat, two-colour, geometric]

### Motion & animation
- [e.g. Subtle and purposeful — no decoration for its own sake]
- [e.g. Default easing: ease-out, 200–300ms for UI, 400–600ms for page transitions]
- [e.g. No looping animations unless user-initiated]

---

## Reference Sites & Components

List sites, products, or components that capture what you're going for — and what specifically you like about each.

| Source                        | What to draw from                          |
|-------------------------------|--------------------------------------------|
| [URL or name]                 | [e.g. Typography hierarchy and spacing]    |
| [URL or name]                 | [e.g. Card component style]                |
| [URL or name]                 | [e.g. Colour palette and button treatment] |
| [URL or name]                 | [e.g. Overall editorial layout feel]       |

---

## Explicit Don'ts

Things that are off-brand or explicitly prohibited.

### Visual
- [ ] No purple-on-white gradient backgrounds
- [ ] No drop shadows heavier than `0 2px 8px rgba(0,0,0,0.08)`
- [ ] No stock-photo clipart or generic business imagery
- [ ] No rainbow or multi-colour iconography
- [ ] No [add your own]

### Typography
- [ ] No Inter, Roboto, or Arial — use the fonts defined above
- [ ] No all-caps body text
- [ ] No font sizes below 12px
- [ ] No [add your own]

### Interactions & UX
- [ ] No auto-playing audio or video
- [ ] No carousels / sliders without user intent
- [ ] No modal-on-load popups
- [ ] No [add your own]

### Tone & copy
- [ ] No jargon or buzzwords ([e.g. "synergy", "leverage", "game-changer"])
- [ ] No passive voice in CTAs
- [ ] No [add your own]

---

## Component Notes *(optional)*

Call out any component-specific design decisions that override or extend the above.

### Buttons
- Primary: filled, `border-radius: [X]px`, min-width 120px
- Secondary: outline, same radius
- Danger: use Error colour, never as a default

### Forms
- Label above input always (never floating)
- Error state: red border + inline message below field
- Placeholder text: muted, never as a substitute for a label

### Cards
- [Describe shadow, border, padding, hover state]

### Navigation
- [Describe sticky behaviour, mobile approach, active state]

---

*Last updated: [date] · Maintained by: [name or team]*
