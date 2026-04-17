# OndeAssistir — Style Guide

> Design system reference for Dark and Light modes.  
> Font: **Sora** (Google Fonts) · Primary accent: **Purple** · Sports streaming theme

---

## 1. Brand

| Property | Value |
|---|---|
| App name | Onde Assistir |
| Font family | `Sora`, sans-serif |
| Font weights | 400 (regular), 500 (medium), 600 (semibold), 700 (bold) |
| Font URL | `https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap` |
| Icon font | Material Symbols Rounded (filled, 24px, weight 400) |
| Favicon (SVG) | `https://img.ondeassistir.tv/images-scr/favicon/favicon.svg` |
| Apple Touch Icon | `https://img.ondeassistir.tv/images-scr/favicon/apple-touch-icon.png` |
| Theme color (dark) | `#0F0F23` |
| Theme color (light) | `#FFFFFF` |
| Status bar style | `black-translucent` |

---

## 2. Color Palette

All values are **HSL** (without `hsl()` wrapper). Use as `hsl(VAR)` in CSS.

### Core tokens

| Token | Dark Mode | Light Mode |
|---|---|---|
| `--background` | `215 28% 7%` | `48 33.3% 97.1%` |
| `--foreground` | `210 40% 98%` | `222.2 84% 4.9%` |
| `--card` | `215 25% 10%` | `0 0% 100%` |
| `--card-foreground` | `210 40% 98%` | `222.2 84% 4.9%` |
| `--popover` | `215 25% 10%` | `0 0% 100%` |
| `--popover-foreground` | `210 40% 98%` | `222.2 84% 4.9%` |
| `--primary` | `270 100% 50%` | `270 100% 50%` |
| `--primary-foreground` | `355 100% 97%` | `0 0% 100%` |
| `--secondary` | `215 25% 16%` | `210 40% 96%` |
| `--secondary-foreground` | `210 40% 98%` | `222.2 84% 4.9%` |
| `--muted` | `215 25% 16%` | `210 40% 96%` |
| `--muted-foreground` | `215 20% 65%` | `215.4 16.3% 46.9%` |
| `--accent` | `215 25% 16%` | `210 40% 96%` |
| `--accent-foreground` | `210 40% 98%` | `222.2 84% 4.9%` |
| `--destructive` | `0 84% 60%` | `0 84.2% 60.2%` |
| `--destructive-foreground` | `210 40% 98%` | `0 0% 100%` |
| `--border` | `215 25% 16%` | `214.3 31.8% 91.4%` |
| `--input` | `215 25% 16%` | `214.3 31.8% 91.4%` |
| `--ring` | `270 100% 50%` | `270 100% 50%` |

### Sport-specific tokens

| Token | Dark Mode | Light Mode |
|---|---|---|
| `--live` | `0 84% 60%` | `0 84% 60%` |
| `--live-foreground` | `210 40% 98%` | `0 0% 100%` |
| `--upcoming` | `270 100% 50%` | `270 100% 50%` |
| `--upcoming-foreground` | `210 40% 98%` | `0 0% 100%` |
| `--past` | `215 20% 65%` | `215 20% 65%` |
| `--past-foreground` | `210 40% 98%` | `0 0% 100%` |

### Sidebar tokens

| Token | Dark Mode | Light Mode |
|---|---|---|
| `--sidebar-background` | `215 28% 7%` | `0 0% 98%` |
| `--sidebar-foreground` | `210 40% 98%` | `222.2 84% 4.9%` |
| `--sidebar-primary` | `270 100% 50%` | `270 100% 50%` |
| `--sidebar-primary-foreground` | `355 100% 97%` | `0 0% 100%` |
| `--sidebar-accent` | `215 25% 16%` | `210 40% 96%` |
| `--sidebar-accent-foreground` | `210 40% 98%` | `222.2 84% 4.9%` |
| `--sidebar-border` | `215 25% 16%` | `214.3 31.8% 91.4%` |
| `--sidebar-ring` | `270 100% 50%` | `270 100% 50%` |

---

## 3. Border Radius

| Token | Value |
|---|---|
| `--radius` | `0.75rem` (12px) |
| `border-radius-lg` | `var(--radius)` → 0.75rem |
| `border-radius-md` | `calc(var(--radius) - 2px)` → 0.625rem (10px) |
| `border-radius-sm` | `calc(var(--radius) - 4px)` → 0.5rem (8px) |

---

## 4. Typography Scale

| Name | Size |
|---|---|
| `text-tiny` | `0.5rem` (8px) |
| Default Tailwind scale | `text-xs` through `text-9xl` |

---

## 5. Status Badges

### Live Badge (`.live-badge`)
- **Background**: `#75fa74` (bright green)
- **Text**: `#000000` (black)
- **Font size**: 10px, weight 500
- **Padding**: 2px 6px
- **Border radius**: 24px (pill)
- **Animation**: `pulse-live` 2s infinite

### Upcoming Badge (`.upcoming-badge`)
- **Background**: `#570df8` (deep purple)
- **Text**: `#feffff`
- **Font size**: 9px, weight 500
- **Padding**: 2px 2px
- **Border radius**: 4px

### Postponed Badge (`.postponed-badge`)
- **Background**: `#64748b` (slate gray)
- **Text**: `#feffff`
- **Font size**: 8px, weight 500
- **Padding**: 2px 8px
- **Border radius**: 4px

### Delayed Badge (`.delayed-badge`)
- **Background**: `#ef4444` (red)
- **Text**: `#ffffff`
- **Font size**: 8px, weight 500
- **Padding**: 2px 7px
- **Border radius**: 4px
- **Animation**: `pulse` 2s infinite

### Pre-game Postponed Badge (`.pregame-postponed-badge`)
- **Background**: `#570df8` (purple)
- **Text**: `#ffffff`
- **Font size**: 8px, weight 500
- **Padding**: 2px 2px
- **Border radius**: 4px
- **Animation**: `pulse` 2s infinite

### Canceled / Abandoned Badge (`.canceled-badge`)
- **Background**: `#64748b`
- **Text**: `#ffffff`
- **Font size**: 8px, weight 500
- **Padding**: 4px 8px
- **Border radius**: 6px

### Finished Status (`.finished-status`)
- **Background**: `#64748b`
- **Text**: `#ffffff`
- **Font size**: 8px, weight 500
- **Padding**: 4px 8px
- **Border radius**: 6px

### Halftime Status (`.halftime-status`)
- **Background**: `#64748b`
- **Text**: `#ffffff`
- **Font size**: 8px, weight 500
- **Padding**: 4px 8px
- **Border radius**: 6px

---

## 6. Animated Borders

All use `@property --border-angle` with `border-spin` keyframe (0deg → 360deg).

### Live (`.animated-border-live`)
- **Border**: 2px solid transparent
- **Border radius**: 0.5rem
- **Duration**: 7s linear infinite
- **Gradient stops** (conic): `hsl(142 76% 36% / 48%)` → `hsl(142 76% 36%)` → `hsl(142 86% 46%)` → back

### Pregame (`.animated-border-pregame`)
- **Border**: 1px solid transparent
- **Border radius**: 0.5rem
- **Duration**: 7s linear infinite
- **Gradient stops** (conic): `hsl(239 84% 67% / 48%)` → `hsl(239 84% 67%)` → `hsl(239 92% 75%)` → back

### Gold (`.animated-border-gold`)
- **Border**: 2px solid transparent
- **Border radius**: 0.5rem
- **Duration**: 7s linear infinite
- **Gradient stops** (conic): `hsl(45 93% 47% / 48%)` → `hsl(45 93% 57%)` → `hsl(45 100% 65%)` → back

### Sprint (`.animated-border-sprint`)
- **Border**: 1.5px solid transparent
- **Border radius**: 9999px (pill)
- **Duration**: 4s linear infinite
- **Gradient stops** (conic): `hsl(0 84% 60% / 48%)` → `hsl(25 95% 53%)` → `hsl(45 93% 58%)` → back

All animated borders use `linear-gradient(hsl(var(--card)), hsl(var(--card))) padding-box` as inner fill.

---

## 7. Animations

| Name | Keyframe | Duration | Easing |
|---|---|---|---|
| `pulse-live` | opacity 1 → 0.7 → 1 | 2s | `cubic-bezier(0.4, 0, 0.6, 1)` infinite |
| `border-spin` | `--border-angle` 0 → 360deg | varies (4s–7s) | linear infinite |
| `fade-in` | opacity 0 + translateY(10px) → 1 + 0 | 0.36s | ease-out |
| `fade-in-delay-1` | same as fade-in | 0.36s, delay 0.2s | ease-out, `both` |
| `fade-in-delay-2` | same | 0.36s, delay 0.4s | ease-out, `both` |
| `fade-in-delay-3` | same | 0.36s, delay 0.6s | ease-out, `both` |
| `slide-in-top` | translateY(-100%) → 0 | 0.3s | ease-out |
| `slide-out-top` | translateY(0) → -100% | 0.3s | ease-out |
| `accordion-down` | height 0 → auto | 0.2s | ease-out |
| `accordion-up` | height auto → 0 | 0.2s | ease-out |
| `ping-slow` | ping keyframe | 3s | `cubic-bezier(0, 0, 0.2, 1)` infinite |

---

## 8. Gradients

### Match detail overlay
```css
/* Dark mode */
linear-gradient(180deg, hsl(var(--background) / 0.7) 0%, hsl(var(--background)) 100%)

/* Light mode */
linear-gradient(180deg, hsl(var(--background) / 0.5) 0%, hsl(var(--background)) 100%)
```

### Team header gradient
```css
linear-gradient(135deg, ${teamPrimaryColor} 0%, hsl(var(--background)) 100%)
```
With dark overlay:
```css
/* Dark */
linear-gradient(180deg, rgba(0,0,0,0.5) 0%, hsl(var(--background)) 100%)
/* Light */
linear-gradient(180deg, rgba(0,0,0,0.3) 0%, hsl(var(--background)) 100%)
```

### Match card team color gradient
```css
linear-gradient(120deg, ${awayColor}, ${homeColor})
```

---

## 9. Interactive States

### Button press
```css
button:active,
a[role="button"]:active,
.clickable:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}
```

### Focus visible (keyboard)
```css
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Focus (mouse) — no ring
```css
*:focus:not(:focus-visible) {
  outline: none;
}
```

### Finished match card hover
```css
.finished-match-card:hover { transform: scale(1.05); }
.finished-match-card:active { transform: scale(0.98); }
```

---

## 10. Mobile & Safe Areas

### Safe area CSS variables
```css
--safe-area-inset-top: env(safe-area-inset-top, 0px);
--safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
--status-bar-height: 24px; /* fallback */
```

### Input zoom prevention (iOS)
```css
@media (max-width: 640px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}
```

### Safe bottom for fixed elements
```css
.safe-bottom {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
```

### Tailwind safe area spacing utilities
```
pt-safe-top    → env(safe-area-inset-top)
pb-safe-bottom → env(safe-area-inset-bottom)
pl-safe-left   → env(safe-area-inset-left)
pr-safe-right  → env(safe-area-inset-right)
```

### Viewport meta
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### Scrollbar hiding (global)
All scrollbars are hidden across WebKit, Firefox, and IE/Edge.

---

## 11. Light Mode Overrides

### Green text adjustment
In light mode, the bright green `#75fa74` is overridden to a darker green for readability:
```css
.light .text-\[\#75fa74\] {
  color: rgb(21 128 61) !important; /* green-700 */
}
```

### Light mode class
Light mode is applied via the `.light` class on a parent element (not `:root` or `prefers-color-scheme`). Dark is the default.

---

## 12. Finished Match Cards

| Property | Value |
|---|---|
| Card width | 84px |
| Card height | 56px |
| Scroll snap | `scroll-snap-align: start` |
| Gap | 8px |
| Padding | 12px 16px |
| Badge size | 12px × 12px |
| Team name | 10px, weight 500, max-width 24px |
| Score | 14px, weight 700 |
| League name | 9px, uppercase, letter-spacing 0.5px |
| Penalty text | 9px, `muted-foreground` |

---

## 13. Container

```
max-width: 1400px (2xl breakpoint)
padding: 2rem
center: true
```

---

*Generated from `src/index.css`, `tailwind.config.ts`, `src/tailwind.config.ts`, and `index.html`.*
