---
name: Currents
description: Apparent's red editorial-terminal system for an audience-intent intelligence product — insight leads, evidence one step behind.
colors:
  red: "#fa0500"
  red-text: "#d90400"
  plum: "#780000"
  cream: "#f7f4f2"
  charcoal: "#242322"
  stone: "#e2dfd8"
typography:
  display:
    fontFamily: "'Inter Tight', sans-serif"
    fontSize: "2.35rem"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Inter Tight', sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Inter Tight', sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "0"
  body:
    fontFamily: "'Inter Tight', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0"
  label:
    fontFamily: "'DM Mono', monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.16em"
  data:
    fontFamily: "'DM Mono', monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0"
  numeral:
    fontFamily: "'DM Mono', monospace"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0"
rounded:
  chip: "4px"
  panel: "16px"
  pill: "9999px"
spacing:
  gutter: "20px"
  gutter-wide: "32px"
  row: "20px"
  section: "40px"
  section-wide: "56px"
components:
  nav-pill:
    textColor: "{colors.red-text}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  nav-pill-active:
    backgroundColor: "{colors.red-text}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  status-pill-accelerating:
    backgroundColor: "{colors.red-text}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-pill-emerging:
    textColor: "{colors.red-text}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-pill-established:
    textColor: "{colors.charcoal}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  status-pill-declining:
    textColor: "{colors.plum}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  source-chip:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.cream}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  momentum-panel:
    backgroundColor: "{colors.charcoal}"
    rounded: "{rounded.panel}"
    padding: "20px 24px"
  action-circle:
    backgroundColor: "{colors.red}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    size: "24px"
  opportunity-card:
    rounded: "{rounded.panel}"
    padding: "24px 28px"
---

# Design System: Currents

## Overview

**Creative North Star: "The Apparent Red Terminal"**

Currents wears Apparent's own site system as a working instrument: a cream
editorial page where red is the working colour — hairline rules, pill chips
and controls, mono uppercase annotations — and where data lives inside
rounded charcoal terminal panels with red numerics, echoing the LED
market-board photography of the Apparent site. The feel is a hybrid of
strategy presentation, intelligence terminal and editorial publication.
Insight always leads: the first thing on any surface is a finding stated in
Inter Tight, with the evidence one step behind it in DM Mono.

The system explicitly refuses the blue-SaaS dashboard and the
decorative-metaphor chart. There are no KPI-tile grids, no shadows, no
gradients, no icon sets — direction and status are drawn as hairline SVG
strokes and worded pills. Density is editorial-ledger density: full-width
rows with generous vertical rhythm, not card walls. Every displayed figure
carries its provenance (source chip, report, confidence, fixture status) in
compact mono metadata.

Adoption status: the Surface route is the canonical expression of this
system. Deep Dive routes still wear an earlier, quieter chrome; they are
pending adoption of this system — do not copy their current look for new
work.

**Key Characteristics:**
- Cream ground, red as the working colour, charcoal as the data material
- Two voices: Inter Tight for insight, DM Mono uppercase for evidence and
  provenance
- Hairline red rules and pill geometry structure the page; no shadows
- Data visualisation confined to charcoal terminal panels with red marks
- Honesty furniture everywhere: fixture stamps, "not connected" chips,
  confidence labels

## Colors

A three-material palette — cream paper, charcoal terminal, working red —
with stone as the touch tint and plum reserved for decline.

### Primary
- **Signal Red** (#fa0500, `--color-red`): the brand red from the supplied
  Apparent logo assets. Used for structure and graphics: hairline section
  rules (usually at reduced opacity — /25 for page furniture, /30 for card
  borders, /70 for pill outlines), the momentum bars, the red circular
  action affordance, focus outlines, and large red numerals on charcoal.
  Never used for small type on cream.
- **Working Red** (#d90400, `--color-red-text`): the AA-compliant rendition
  of brand red — 4.9:1 on cream where #fa0500 reaches only 3.8:1. Used for
  all small red type on cream (mono labels, annotations, momentum figures
  in the table) and for small text-carrying fills (active nav pill,
  Accelerating status pill, Fixture data stamp).

### Secondary
- **Plum** (#780000, `--color-plum`): the recessive brand red. One job:
  the Declining status treatment (outline pill, plum text). Not a general
  accent.

### Neutral
- **Cream** (#f7f4f2, `--color-cream`): the page ground, and the text
  colour on charcoal and on red fills.
- **Charcoal** (#242322, `--color-charcoal`): default text colour, the
  terminal-panel material, and the connected source-chip fill. Muted text
  is charcoal at opacity — /80 and /75 for secondary text, /70 for
  metadata, /10 for ledger hairlines.
- **Stone** (#e2dfd8, `--color-stone`): touch tint only — row hover
  (stone/30) and the expanded-marker tray (stone/25). Never a panel fill.

### Named Rules
**The Two Reds Rule.** `--color-red` for rules, bars, graphic fills and
large numerals; `--color-red-text` for small type on cream and small
text-carrying fills. Never set small type on cream in #fa0500.

**The Red Ration Rule.** Red is the working colour, not a flood: hairlines,
pills, figures and one circular affordance. Field fills stay cream,
charcoal or stone; red fill areas stay small (pills, stamps, the 24px
action circle, the bars inside the panel).

**The Word-First Rule.** Colour never carries meaning alone. Status is a
worded pill, direction is a worded label plus a stroke arrow, confidence is
a written word. The colour reinforces; the word carries.

## Typography

**Display/Body Font:** Inter Tight (sans-serif fallback) — the variable
font deliberately clamped to weights 400 and 500 only
**Label/Mono Font:** DM Mono (monospace fallback), 400 and 500

**Character:** One contemporary grotesk voice for interpretation, one
typewriter-terminal voice for evidence. The pairing is the product thesis
in type: Inter Tight says what it means; DM Mono shows the working.

### Hierarchy
- **Display** (500, 2.35rem mobile / 3.1rem from the sm breakpoint,
  line-height 1.06, tracking −0.02em, text-balance): the lead analysis
  statement. One per page.
- **Headline** (500, 22px, tracking −0.01em): section headings ("What's
  moving", "So what"), sentence case, set on a red hairline baseline rule.
- **Title** (500, 16px table rows / 19px opportunity cards, snug leading):
  current and opportunity titles.
- **Body** (400, 15px lead dek / 13.5–14.5px supporting copy, relaxed
  leading, max 58–62ch): interpretation prose, usually charcoal at /70–/80.
- **Label** (DM Mono 400, 9–10px, uppercase, letter-spacing 0.12–0.18em —
  wider tracking at smaller sizes): all annotations, column headers,
  provenance lines, stamps and chips.
- **Data** (DM Mono 400, 11px, normal case): magnitudes, metrics, IDs,
  timestamps.
- **Numeral** (DM Mono 500, 24px, line-height 1): the momentum figures in
  red on the charcoal panel — the only large mono setting.

### Named Rules
**The Two Weights Rule.** Inter Tight at 400 for copy and 500 for
headlines; nothing bolder, nothing lighter. Headlines are sentence case.
Swiss Posters is retired and must not be used.

**The Two Voices Rule.** If it interprets, it is Inter Tight; if it is
evidence, metadata or machinery, it is DM Mono. No third voice, no italics.

## Layout

A single centred column: max-width 80rem (max-w-7xl), gutters 20px mobile /
32px from sm. The page reads top-down as a bulletin — validity stamp, lead
analysis beside the momentum panel, current table, opportunities,
methodology foot.

- **Lead grid:** 7fr / 5fr at lg (statement left, charcoal panel right),
  stacking on smaller screens; column gap 40–56px.
- **The ledger:** the current table is a CSS grid with fixed metadata
  columns — `9rem` status, fluid title, `10.5rem` magnitude, `9.5rem`
  momentum, `6.5rem` confidence, `2.25rem` action — over full-width rows
  (20px vertical padding) divided by charcoal/10 hairlines. Below sm the
  row collapses to status + title with the mono columns hidden; the column
  header row is desktop-only.
- **Section furniture:** every section opens with a headline on a red
  hairline baseline rule, with a mono annotation right-aligned on the same
  baseline. Bars above the fold (header, context bar, validity stamp) are
  full-width strips divided by red/25 hairlines.
- **Rhythm:** section padding 40px (56px from sm); cards on an 24px grid
  gap; metadata lines separated with mono middot (`·`) runs rather than
  extra structure.
- **Responsive stance:** desktop is the working environment; mobile keeps
  the bulletin readable as a concise stacked summary (context bar scrolls
  horizontally, table collapses, panel stacks under the lead).

## Elevation & Depth

Completely flat: no box-shadows anywhere in the system. Depth is conveyed
by material change — the charcoal terminal panel sitting on the cream page
is the strongest plane shift — plus hairline borders and the stone tint for
touched or expanded states (hover stone/30, expanded tray stone/25).

### Named Rules
**The No-Shadow Rule.** Surfaces never cast shadows. If a region must read
as a different plane, change its material (charcoal panel, stone tint) or
draw a hairline around it.

## Shapes

Two geometries: the pill and the soft slab. Interactive chips, status
marks, nav controls and stamps are fully rounded pills (9999px), mostly
hairline-outlined, filled only when loudest. Panels and cards are 16px
rounded slabs (the charcoal momentum panel, the opportunity card with its
red/30 hairline). Source chips alone use a tight 4px radius — a squarer,
machine-stamped mark. The one pictorial affordance is the 24px red circle
carrying a stroked plus, rotating 45° to an × when its row is open; all
other glyphs are 1.5px-stroke SVG arrows drawn inline. No icon libraries,
no decorative illustration.

## Components

### Navigation (pill tabs)
- **Character:** Apparent-site pill controls; the active surface is the
  filled one.
- **Shape:** full pill; padding 6px 16px; 12.5–13.5px Inter Tight 500.
- **Default:** red/70 hairline outline, Working Red text, transparent fill.
- **Hover:** red/10 wash. **Active page:** filled `--color-red-text`,
  cream text.
- **Focus (global):** 2px `--color-red` outline, 2px offset — every
  focusable element inherits this from the base layer.

### Status pills
- **Style:** full pill, DM Mono 10px 500 uppercase, tracking 0.12em,
  padding 2px 10px, hairline border.
- **Variants:** Accelerating is the loudest — filled Working Red, cream
  text. Emerging — red/70 outline, Working Red text. Established — settled:
  charcoal/50 outline, charcoal/80 text. Declining — recedes: plum/60
  outline, plum text. The word always appears.

### Source chips
- **Connected:** charcoal fill, cream text, 4px radius, DM Mono 10px
  uppercase (SEMRUSH / GA4 / GWI / BRANDWATCH).
- **Not connected:** transparent with charcoal/30 outline, charcoal/70
  text, and the literal suffix "· not connected" in normal case. Never
  faked as live.

### Cards / Containers
- **Opportunity card:** 16px radius, red/30 hairline border, no fill, no
  shadow; 24–28px internal padding; title 19px / narrative 14.5px at
  charcoal/80 / mono provenance foot.
- **Charcoal terminal panel:** 16px radius, `--color-charcoal` fill,
  20–24px padding; internal dividers cream/10; small text cream at
  /60–/75; red reserved for the bars and the 24px momentum numerals.

### Metadata bars (validity stamp, context bar)
- **Style:** full-width strips under red/25 hairlines; DM Mono label/value
  pairs (label 10px uppercase Working Red, value 11–13px charcoal), rows of
  pairs separated by gaps, honesty stamp pushed right (`Fixture data`
  filled Working Red pill; `Demo context` outlined pill).

### Ledger rows (current table)
- **Behaviour:** the whole row is the disclosure button (`aria-expanded`),
  hover stone/30, 200ms colour transition. The 24px red action circle sits
  at row end and rotates 45° when open (motion-reduce: no transition).
- **Expansion:** a grid-rows 0fr→1fr reveal (200ms ease-out) opening a
  stone/25 marker tray: statement in Inter Tight 14px 500, metric in DM
  Mono 11px, provenance line with source chip, report, confidence and
  fixture flag.

### The Momentum Panel (signature)
The rounded charcoal terminal carrying each current's 12-week demand index
as red SVG bars (7px wide, 4px gap, 34px tall, opacity ramping 0.55→1.0
toward the present) beside its momentum figure in 24px red mono. Its bars
rising once on load (0.9s, cubic-bezier(0.22, 1, 0.36, 1), 30ms stagger
per bar, guarded by prefers-reduced-motion) is the page's one authored
motion moment. The currents table below is the accessible alternative to
the panel's graphics.

### Named Rules
**The One Motion Rule.** One authored motion moment per page (the momentum
bars rising); everything else is a 200ms utility transition, and all of it
collapses to a settled state under prefers-reduced-motion.

**The Honesty Furniture Rule.** Fixture data is stamped FIXTURE wherever a
viewer could mistake it for live evidence; unavailable sources render as
"not connected" chips; confidence is always written out. These labels are
part of the design, not debug output.

## Do's and Don'ts

### Do:
- **Do** use the tokens (`--color-red`, `--color-red-text`, `--color-plum`,
  `--color-cream`, `--color-charcoal`, `--color-stone`); never hard-code
  hex values in components.
- **Do** lead every surface with an insight in Inter Tight before any
  chart or navigation chrome; keep evidence one step behind in DM Mono.
- **Do** put data visualisation inside a rounded charcoal panel with red
  marks and cream small text, and provide a text alternative alongside.
- **Do** structure sections with red hairline baseline rules and
  right-aligned mono annotations; use charcoal/10 hairlines inside
  ledgers.
- **Do** carry provenance on every displayed finding: source chip, report
  name, confidence word, fixture flag.
- **Do** guard all motion with prefers-reduced-motion and keep the
  focus-visible red outline intact on every interactive element.
- **Do** render Apparent only as the supplied logo assets in
  `/public/brand/`; the header is the red lockup + "Currents" in Inter
  Tight 500.

### Don't:
- **Don't** typeset "Apparent Currents" as a wordmark or build a combined
  logo; the lockup asset plus the typeset product name is the only pattern.
- **Don't** use Swiss Posters, weights outside 400/500, uppercase
  headlines, or a third typeface.
- **Don't** set small type on cream in #fa0500 — that is what
  `--color-red-text` (#d90400) exists for.
- **Don't** use shadows, gradients, glow effects, "AI purple", icon
  libraries, KPI-tile grids or equal-weight card walls; this is an
  editorial terminal, not a martech dashboard.
- **Don't** let colour carry meaning alone — status, direction and
  confidence are always worded.
- **Don't** present fixture or unavailable data as live; the honesty
  stamps and "not connected" chips are mandatory.
- **Don't** copy the current Deep Dive chrome for new surfaces; it
  predates this system and is pending adoption.
