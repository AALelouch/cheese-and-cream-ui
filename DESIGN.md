---
name: Cheese & Cream
description: A calm blue-black bodega ledger with warm cream hierarchy and restrained gold actions.
colors:
  ledger-ink: "#0d171f"
  ledger-raised: "#14222c"
  ledger-hover: "#1b2d39"
  navigation-ink: "#101d26"
  navigation-active: "#24333a"
  field-slate: "#213642"
  ledger-rule: "#30454f"
  ledger-rule-strong: "#49626c"
  dairy-cream: "#fff7e5"
  cream-wash: "rgb(255 247 229 / .08)"
  working-text: "#eef3ef"
  muted-text: "#b9c8c8"
  subtle-text: "#83989a"
  butter-gold: "#e6bd65"
  butter-gold-strong: "#f4d17c"
  action-ink: "#17212b"
  success-cool: "#91c49a"
  information-cool: "#8bc4d2"
  danger-soft: "#ef9b90"
  danger-wash: "rgb(239 155 144 / .12)"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(2.6rem, 5vw, 4.65rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(1.85rem, 3vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.18rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Manrope, Space Grotesk, system-ui, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, Space Grotesk, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  control: "8px"
  navigation: "9px"
  surface: "14px"
  shell: "18px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.butter-gold}"
    textColor: "{colors.action-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.butter-gold-strong}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.control}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.working-text}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.butter-gold}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger-wash}"
    textColor: "{colors.danger-soft}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
    height: "44px"
  field:
    backgroundColor: "{colors.field-slate}"
    textColor: "{colors.working-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.ledger-raised}"
    textColor: "{colors.working-text}"
    rounded: "{rounded.surface}"
    padding: "22px"
  count-pill:
    backgroundColor: "{colors.cream-wash}"
    textColor: "{colors.butter-gold}"
    rounded: "{rounded.pill}"
    padding: "4px 9px"
---

# Design System: Cheese & Cream

## Overview

**Creative North Star: "The Midnight Bodega Ledger"**

Cheese & Cream is a precise working ledger after hours: calm blue-black surfaces hold the operational record, warm cream establishes reading hierarchy, and butter-gold appears only where staff can act. The system feels established and dependable rather than ornamental. Brand presence comes from the visible logo, the “Libro de bodega” descriptor, finely ruled structure, and unusually careful financial typography.

This is an Operate-mode interface. It keeps the route from business state to action direct: grouped navigation, consolidated metrics, compact controls, legible tables, and explicit Spanish recovery states. Cool green and blue distinguish positive and informational readings; soft coral is reserved for debt, destructive action, invalid input, and failure.

**Key Characteristics:**

- Continuous ledger-like reading order rather than disconnected dashboard widgets.
- Blue-black tonal layering with fine rules and quiet, structural shadows.
- Warm cream for hierarchy and restrained gold for interaction.
- Cool semantic status colors that remain distinct from primary actions.
- Compact, touch-safe controls and responsive behavior down to a 390px viewport.
- Visible logo and “Libro de bodega” language at authentication and navigation anchors.

## Colors

The palette reads like a night ledger lit by warm counter light: near-black blue surfaces, cream content, gold controls, and cool operational signals.

### Primary

- **Butter Gold:** The scarce action color for primary buttons, focus indicators, active icons, section icons, and deliberate emphasis.
- **Strong Butter Gold:** The brighter interaction state used for hover, selection, and high-contrast text selection.

### Secondary

- **Cool Information Blue:** Profit and informational status, never a competing call to action.
- **Cool Success Green:** Revenue, incoming operations, and positive business state.

### Tertiary

- **Soft Coral Danger:** Pending debt, destructive actions, validation failures, and recoverable API errors.

### Neutral

- **Ledger Ink:** The page canvas and deepest detail surface.
- **Raised Ledger:** The standard card, modal, and metrics-board surface.
- **Navigation Ink:** The persistent navigation rail and mobile drawer.
- **Field Slate:** Form controls that remain visibly editable without becoming bright panels.
- **Dairy Cream:** The warm highest-emphasis color for headings, amounts, and the logo medallion.
- **Working Text:** Default readable content.
- **Muted and Subtle Text:** Supporting copy, metadata, group labels, and unavailable values.
- **Ledger Rules:** Fine standard and strong dividers that provide structure without boxing every element.

**The Gold Is an Action Rule.** Gold marks interaction or rare emphasis; it does not flood large surfaces.

**The Semantic Separation Rule.** Green, blue, and coral communicate business meaning and never substitute for the primary gold action.

## Typography

**Display Font:** Space Grotesk (with sans-serif fallback)  
**Body Font:** Manrope (with Space Grotesk, system-ui, and sans-serif fallbacks)

**Character:** Space Grotesk gives headings and monetary values a compact, ledger-like authority. Manrope keeps dense forms, tables, controls, and recovery copy calm and highly legible.

### Hierarchy

- **Display** (700, fluid display scale, 0.98 line-height): Reserved for the large authentication statement; keep its measure close to 11 characters per line.
- **Headline** (700, fluid page-title scale, 1.06 line-height): Page titles and authentication headings, balanced and tightly tracked.
- **Title** (700, compact title scale): Card headings, modal headings, and section totals.
- **Body** (400–700, regular interface scale, 1.5–1.7 line-height): Descriptions, labels, table content, field notes, and recovery instructions; explanatory copy stays near 42–62 characters per line.
- **Label** (800, compact label scale, 0.08em letter-spacing): Eyebrows, navigation groups, ledger metadata, and table headings; uppercase only where it strengthens scanning.

**The Financial Figure Rule.** Monetary values use Space Grotesk with tabular numerals so columns and changing dashboard totals remain stable.

**The Two-Voice Rule.** Space Grotesk carries hierarchy and figures; Manrope carries operational reading. Do not introduce a third display voice.

## Layout

Authenticated desktop screens use a fixed 264px navigation rail and a content region with fluid horizontal padding, capped at 1440px. Pages follow a vertical ledger rhythm: heading and actions, one fine divider, feedback state, then consolidated content. Standard cards use 22px internal padding; compact mobile cards use 17px. Repeated grids use 14–18px gaps, while page sections use 24–30px separation.

The dashboard presents its three primary metrics as one ruled board rather than three floating cards. Supporting account views form a two-column grid. CRUD screens place search and filters before horizontally scrollable tables; forms use two columns and collapse to one.

At 900px, dashboard metric and detail grids stack. At 820px, authentication drops the editorial panel and centers the credential card. At 760px, the sidebar becomes an off-canvas drawer beneath a 68px sticky app bar; page headers and forms stack, content uses 16px side padding, and tables remain horizontally scrollable. At 700px, operation detail and item grids become single-column. At 560px and the 390px target, action groups take the available width, metric rows become shorter, and recovery actions stack without reducing 44px touch targets.

**The Continuous Ledger Rule.** Group related information with shared surfaces and dividers before introducing another card boundary.

**The 390px Completion Rule.** Every primary workflow must remain completable at 390px without clipped controls, hidden recovery actions, or reduced tap targets.

## Elevation & Depth

Depth is quiet and structural. Tonal layering and one-pixel ledger rules do most of the work; shadows identify persistent navigation, consolidated boards, modal overlays, and the authentication shell. Cards do not float independently for decoration.

### Shadow Vocabulary

- **Soft Surface:** A low, diffuse shadow for standard cards and supporting dashboard sections.
- **Ledger Board:** A slightly deeper ambient shadow for consolidated metric groups.
- **Persistent Rail:** A broad horizontal shadow that separates navigation from the working canvas.
- **Overlay:** The strongest shadow, reserved for modal content and the authentication shell.
- **Action Lift:** A restrained gold-tinted shadow plus a one-pixel rise on primary-button hover.

**The Rule-Before-Shadow Rule.** Use tonal contrast and a fine border first; add shadow only when a surface changes layer or persistence.

## Shapes

The form language is gently rounded and practical: 8px controls and table frames, 9px navigation items, 14px working surfaces, and an 18px authentication shell. Pills are fully rounded for counts and statuses; circles are reserved for the logo frame, metric icons, and close controls. Fine one-pixel borders are the dominant edge treatment, with dashed rules limited to loading and empty states.

**The Reserved Circle Rule.** Circular geometry belongs to compact icons and brand marks, never to large containers or ordinary buttons.

## Components

### Buttons

- **Shape:** Compact, strongly weighted controls with gently curved corners and a minimum 44px height.
- **Primary:** Butter-gold fill, dark action text, compact horizontal padding, and a restrained tinted shadow.
- **Hover / Focus:** Hover brightens to strong butter gold and rises one pixel; keyboard focus uses a visible 3px gold outline with offset. Reduced-motion preferences remove transitions.
- **Secondary / Ghost / Tertiary:** Ghost buttons use transparent fill and a strong ledger rule; outline buttons use gold text and border; destructive buttons use soft coral on a translucent coral wash. Small table actions retain a 36px height only where they sit inside dense tabular rows.

### Chips

- **Style:** Count pills use gold text on a cream wash with a fine warm border. Operation badges use cool green for incoming values and soft coral for outgoing values.
- **State:** Segmented role and mode controls use a dark track, cream-wash selected state, and gold border; hover changes only the unselected surface and text.

### Cards / Containers

- **Corner Style:** Gently curved working surfaces; the authentication shell is slightly rounder.
- **Background:** Raised ledger blue-black over the deeper page canvas.
- **Shadow Strategy:** Soft by default; stronger only for consolidated boards and overlays.
- **Border:** One-pixel ledger rule on every discrete surface.
- **Internal Padding:** Standard cards use 22px, reducing to 17px on compact screens.

### Inputs / Fields

- **Style:** Slate-filled, 44px-high fields with strong ledger borders, warm caret, and 8px corners.
- **Focus:** Gold border plus a translucent three-pixel gold halo.
- **Error / Disabled:** Invalid fields switch to coral border and halo; disabled controls remain legible and visibly unavailable. Validation and API errors use clear Spanish recovery copy.

### Navigation

The desktop rail keeps the logo and “Libro de bodega” visible, groups routes under compact uppercase labels, and uses gold icons with muted text. Hover raises contrast without changing hierarchy; the active route uses a slightly lighter blue-black field and a warm inset rule. On mobile, the same structure moves into an off-canvas drawer below a sticky branded app bar, with a backdrop and explicit close control.

### Consolidated Metric Board

Revenue, profit, and pending balance share one ruled container. Each metric has a small circular semantic icon, a tabular cream value, explanatory copy, and a thin bottom status rule. Missing data is an em dash with an accessible “No disponible” label; legitimate zero remains a formatted monetary value.

### Tables and Recovery States

Tables use a deep header, compact uppercase labels, 14px cells, tabular right-aligned amounts, fine row rules, and a cool hover wash. Loading and empty states occupy a dashed ledger panel. Errors sit near the failed content, explain what happened in Spanish, and expose a visible retry action whenever the operation is recoverable.

## Do's and Don'ts

### Do:

- **Do** preserve the visible Cheese & Cream logo and “Libro de bodega” descriptor at brand anchors.
- **Do** make the financial state scannable before exposing record-level detail.
- **Do** distinguish an unavailable value with an em dash from a legitimate formatted zero.
- **Do** use grouped navigation, fine ledger rules, and consolidated boards to preserve reading order.
- **Do** keep controls keyboard-visible, touch-safe, and fully usable at 390px.
- **Do** pair recoverable failures with concise Spanish guidance and an explicit next action.

### Don't:

- **Don't** replace the incumbent world with generic white cards, saturated gradients, or disconnected dashboard widgets.
- **Don't** use gold as a broad decorative background or let semantic colors compete with primary actions.
- **Don't** add shadows when tonal layering and one fine rule already establish the boundary.
- **Don't** hide CRUD search, pagination, empty, loading, validation, or API-error states.
- **Don't** introduce a third type family, ambiguous icon-only operational actions, or touch targets below 44px outside dense table actions.
