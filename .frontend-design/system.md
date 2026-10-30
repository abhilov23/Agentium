# Agentium — Extension Frontend Design System

## Intent
Local Chrome automation bridge for AI assistants over MCP. The popup is a control surface: inspect a page, then click/fill/extract. Audience: developers and AI-assistant users. Job: operate the browser through the bridge. Feel: technical, precise, beautiful — like a well-made tool, not a consumer app.

## Palette (light mode, tokens.css)
- `--color-paper` — oklch(98.5% 0.005 100) — warm off-white page surface
- `--color-paper-2` — oklch(94% 0.008 100) — raised layer
- `--color-ink` — oklch(17% 0.015 285) — deep ink (primary text)
- `--color-ink-2` — oklch(26% 0.015 285) — secondary text
- `--color-muted` — oklch(22% 0.01 285) — captions, meta
- `--color-rule` — oklch(86% 0.012 100) — hairlines
- `--color-accent` — oklch(58% 0.155 175) — chromatic teal signal
- `--color-accent-ink` — oklch(12% 0.06 175) — text on accent
- `--color-accent-surface` — oklch(92% 0.06 175) — tinted surface
- `--color-accent-surface-ink` — oklch(20% 0.06 175) — text on accent surface
- `--color-focus` — oklch(58% 0.155 175) — focus ring
- `--color-error` — oklch(58% 0.2 28) — errors, disconnect

## Palette (dark mode, tokens-dark.css, media-query linked)
Same hues, inverted luminances: paper ~11%, ink ~96%, accent ~62%.

## Typography
- `--font-body` — ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif — UI labels, headings
- `--font-mono` — ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace — refs, URLs, codes, data
- Body 14px / 1.55. Heads one weight (600), one colour (ink), tight tracking.

## Depth
Hairline rules (1px) and paper-2 surfaces only. No shadows, no cards-in-cards. Radius: 8px cards, 9999px pills, 6px chips/inputs.

## Motion
transform + opacity only. One reveal (slide-in for result panel). Pulse dot on bridge pill. Reduced-motion respected.

## Logo
- Popup header: detailed colourful logo mark (`LogoMark` component) — browser frame, tab strip, bridge arc between two nodes, cursor arrow, glow filter. Colored via `var(--color-accent)`.
- Browser toolbar/action: simplified mark (`icons/logo-action.svg`) — arc + two nodes, works at 16px.
- Extension icon: `icons/logo.svg` (128px) / `icons/logo-action.svg` (16–48px).

## Key patterns (reuse 2+ times)
- `.button` / `.button-primary` — 36px hairline pill, hover lifts to paper-2
- `.icon-button` — 32px square, hairline
- `.input-row` — labelled field with leading icon, focus ring
- `.element-row` — signature ledger row: ref badge first + name + click/fill actions
- `.chip` — site-state pill (allowed/missing/unsupported)
- `.bridge-pill` — connection state pill with pulse dot

## Container
Popup 440px wide, max 600px tall, centred measure, hairline-separated sections.
