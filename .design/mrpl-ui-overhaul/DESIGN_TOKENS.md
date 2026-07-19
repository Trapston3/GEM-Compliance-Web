# MRPL Compliance UI Overhaul — Token Specification

These tokens are the proposed source of truth for the visual system. They should be implemented as CSS custom properties and consumed by shared primitives rather than repeated Tailwind literals.

## Color tokens

```css
:root {
  --mrpl-ink-950: #0f1b2d;
  --mrpl-ink-900: #17253a;
  --mrpl-ink-800: #24334a;
  --mrpl-ink-700: #3c506b;
  --mrpl-ink-600: #5d708c;
  --mrpl-paper-50: #f7f9fc;
  --mrpl-paper-100: #eef2f7;
  --mrpl-surface: #ffffff;
  --mrpl-line-200: #d9e1eb;
  --mrpl-line-300: #c5d0dd;
  --mrpl-blue-600: #3158d4;
  --mrpl-blue-700: #2445ad;
  --mrpl-blue-50: #edf2ff;
  --mrpl-green-600: #087f5b;
  --mrpl-green-50: #e9f8f1;
  --mrpl-amber-600: #b45309;
  --mrpl-amber-50: #fff6df;
  --mrpl-red-600: #c2413b;
  --mrpl-red-50: #fff0ef;
  --mrpl-note-600: #635bce;
  --mrpl-note-50: #f1efff;
  --mrpl-slate-500: #64748b;
  --mrpl-slate-50: #f1f5f9;
}

.dark {
  --mrpl-ink-950: #091321;
  --mrpl-ink-900: #101d2f;
  --mrpl-ink-800: #1b2a40;
  --mrpl-ink-700: #536985;
  --mrpl-ink-600: #9aabc1;
  --mrpl-paper-50: #0d1522;
  --mrpl-paper-100: #121e2e;
  --mrpl-surface: #172438;
  --mrpl-line-200: #2b3b52;
  --mrpl-line-300: #3c4d65;
  --mrpl-blue-600: #7894ff;
  --mrpl-blue-700: #9aadff;
  --mrpl-blue-50: #17264c;
  --mrpl-green-600: #52c99a;
  --mrpl-green-50: #12372e;
  --mrpl-amber-600: #f7b955;
  --mrpl-amber-50: #3a2c12;
  --mrpl-red-600: #ff8179;
  --mrpl-red-50: #421e20;
  --mrpl-note-600: #a8a2ff;
  --mrpl-note-50: #29264d;
  --mrpl-slate-500: #a7b1c2;
  --mrpl-slate-50: #263244;
}
```

## Status tokens

| Semantic token | Used for | Light foreground | Light surface | Dark foreground | Dark surface |
|---|---|---|---|---|---|
| `--status-submitted` | Submission submitted / acceptance accepted | `--mrpl-green-600` | `--mrpl-green-50` | `--mrpl-green-600` | `--mrpl-green-50` |
| `--status-pending-submission` | Submission not submitted | `--mrpl-amber-600` | `--mrpl-amber-50` | `--mrpl-amber-600` | `--mrpl-amber-50` |
| `--status-not-accepted` | Acceptance not accepted | `--mrpl-red-600` | `--mrpl-red-50` | `--mrpl-red-600` | `--mrpl-red-50` |
| `--status-not-applicable` | Any category not applicable | `--mrpl-slate-500` | `--mrpl-slate-50` | `--mrpl-slate-500` | `--mrpl-slate-50` |
| `--status-note-added` | Non-empty text note | `--mrpl-note-600` | `--mrpl-note-50` | `--mrpl-note-600` | `--mrpl-note-50` |
| `--status-note-empty` | Empty text note | `--mrpl-slate-500` | transparent | `--mrpl-slate-500` | transparent |

## Typography

- Body: existing system stack first for offline/old-office reliability.
- Page title: 24px desktop / 22px mobile, 700–800 weight, tight leading.
- Section title: 16–18px, 700 weight.
- Body: 14px desktop, 16px mobile for inputs and core instructions.
- Metadata: 12px, never the only carrier of meaning.
- Status labels: 12px minimum, sentence case in user-facing controls.
- Avoid relying on all-caps for hierarchy; reserve uppercase for small metadata only.

## Layout and spacing

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --touch-target: 44px;
  --content-max: 1440px;
  --sidebar-width: 248px;
}
```

Use a 12-column desktop grid, a 4-column tablet grid, and a single-column mobile layout. Content should expand to the available workspace up to `--content-max`; never center a narrow 900px panel inside a very wide viewport when the page contains operational data.

## Elevation and surfaces

- Base workspace: `--mrpl-paper-50`.
- Primary panels: `--mrpl-surface` with `1px solid --mrpl-line-200`.
- Hover: border shifts to `--mrpl-blue-600`, no large translate animation.
- Shadow: `0 2px 8px rgb(15 27 45 / 0.06)`; dark mode uses lower-opacity dark shadow.
- No `backdrop-filter` in the default component system.
- If a future device benchmark proves a small glass effect safe, it may be opt-in for one floating toolbar only and must have a solid fallback.

## Motion

- Default transition: 160ms ease-out for color, border, and opacity.
- Modal/sheet entrance: 180ms opacity + 4px translate.
- No continuous animation, blur animation, or large layout movement.
- Under `prefers-reduced-motion`, disable transforms and use opacity/color only.
