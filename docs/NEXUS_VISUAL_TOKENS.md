# NEXUS Cognitive Operations OS — Visual Identity & Tokens Catalog

This document represents the permanent visual reference and styling specification sheet extracted from the premium **NOVA Tactical Preview HUD** (`NovaLauncherPreview.tsx` / `App.css`). Use these tokens, padding models, transitions, and glow algorithms to construct and polish all NEXUS subpages (`SituationRoom`, `Workspaces`, `Signals & Alerts`, etc.).

---

## 1. Core Color System (Aesthetic Gradients & Accents)

The NEXUS color system relies exclusively on deep dark glassmorphism surfaces paired with thin, highly concentrated neon accents.

```css
:root {
  --bg: #010409;                          /* Pure Dark Space Void */
  --surface: rgba(3, 8, 16, 0.55);        /* Tactical Translucent Surface */
  --surface-hover: rgba(5, 12, 24, 0.75);  /* Slightly Brighter Surface Hover */
  --border: rgba(0, 210, 255, 0.08);      /* Stealth Cyber Cyan Border */
  --border-hover: rgba(0, 210, 255, 0.25); /* Active Cyber Cyan Border */

  /* Neon Accents */
  --cyan: #00d2ff;                        /* Primary Tactical Teal */
  --cyan-dim: rgba(0, 210, 255, 0.1);     /* Teal Area Highlight */
  --cyan-glow: rgba(0, 210, 255, 0.25);   /* Cyber Neon Glow */
  --purple: #d500f9;                      /* Intelligence / Memory Magenta */
  --purple-dim: rgba(213, 0, 249, 0.08);
  --purple-glow: rgba(213, 0, 249, 0.2);
  --violet: #7b61ff;                      /* Automation Purple */
  --green: #00e676;                       /* Nominal / Online Status Green */
  --amber: #ffab00;                       /* Warning/Unresolved Alert Amber */
  --red: #ff1744;                         /* Critical Alert Red */

  /* Monospace & Monotype Typography colors */
  --text-bright: #f0f4f8;                 /* Command Texts */
  --text-main: #9cb1c9;                   /* Active Telemetry Outputs */
  --text-muted: #3f5263;                  /* Non-Intrusive System Metadata */
}
```

---

## 2. Signature Glassmorphism Grid Specs (`.glass`)

All tactical modules and cards must use the shared `.glass` class properties. This creates the visual effect of transparent screen overlays embedded in dark cockpit environments.

```css
.glass {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;                     /* var(--radius) */
  backdrop-filter: blur(20px);            /* Heavy structural glass blur */
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.7),       /* Soft surrounding depth shadow */
    inset 0 1px 0 rgba(255, 255, 255, 0.02); /* Simulated internal reflection line */
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.glass:hover {
  border-color: var(--border-hover);      /* Subtle dynamic border shift */
}
```

---

## 3. Spacing, Padding, and Layout Hierarchy

* **Module Shell Margin / Absolute Placement**: Left indentation is locked at `92px` (leaving room for the sidebar rail) and top alignment at `76px` to clear the top bar.
* **Component Padding System**: 
  * Header Rows: `8px 12px` (dense operational layout).
  * Body Contents: `12px` padding with a child gap of `10px` (`display: flex; flex-direction: column; gap: 10px`).
* **Widget Spacing Grid**: Grid items utilize `display: grid; grid-template-columns: 1fr 1fr; gap: 6px;` with inner padding of `6px` for extreme data density.

---

## 4. Motion & Animation Behaviors (Framer-Motion)

To make pages feel responsive and alive, implement the default page transition presets:

```typescript
// Standard Page Slide-in Frame
const PAGE_TRANSITION = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.25, ease: 'easeOut' }
};

// Micro-Interaction Hover Transitions
const BUTTON_HOVER = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15 }
};
```

---

## 5. Live Interactive Widgets & Micro-Glow Layouts

### Resource Load Bar Track
A micro load indicator consisting of:
* Background Track: `height: 2px; background: rgba(255,255,255,0.05); border-radius: 1px;`
* Glowing Fill: `height: 100%; border-radius: 1px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);`

### Neon Sparkline Pulse
Mini inline graph rendering historical telemetry paths with a neon-tinted glow outline:
```xml
<svg class="p-mini-sparkline" width="100%" height="24" viewBox="0 0 160 24">
  <path d="M0,12 Q20,6 40,16 T80,8 T120,18 T160,10" fill="none" stroke="#00e676" stroke-width="1.5" />
</svg>
```

### Monospace Ingestion Row
A status layout optimized for telemetry feeds:
* Style: `font-size: 0.48rem; font-family: var(--mono);`
* Key/Value layout using a flexible horizontal layout: `display: flex; justify-content: space-between;`
