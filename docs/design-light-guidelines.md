# Design Guidelines — Luminous Stream (Light Version)

## Brand Identity

| Element | Value |
|---------|-------|
| **Theme Name** | Luminous Stream |
| **Primary Color** | `#8B5CF6` (Vivid Purple) |
| **Background** | `#F8FAFC` (Off White) |
| **Personality** | Airy, minimalist, high-clarity, professional observability |
| **Mode** | Dual-mode (dark + light) with header icon toggle |

## Color System

### Core Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#F8FAFC` | Main app background |
| `--foreground` | `#0F172A` | Primary text color |
| `--primary` | `#8B5CF6` | Accent, links, active navigation, primary CTAs |
| `--primary-foreground` | `#FFFFFF` | Text on primary buttons |
| `--card` | `#FFFFFF` | Card backgrounds (with airy shadow) |
| `--card-foreground` | `#0F172A` | Card text |
| `--popover` | `#FFFFFF` | Popover/dropdown backgrounds |
| `--popover-foreground` | `#0F172A` | Popover text |
| `--secondary` | `#F1F5F9` | Secondary backgrounds, subtle interactive fills |
| `--secondary-foreground` | `#0F172A` | Text on secondary surfaces |
| `--muted` | `#F1F5F9` | Muted backgrounds, table headers |
| `--muted-foreground` | `#64748B` | Labels, descriptions, secondary text |
| `--accent` | `#F1F5F9` | Hover states, active backgrounds |
| `--accent-foreground` | `#0F172A` | Text on accent surfaces |
| `--destructive` | `#EF4444` | Delete actions, error states |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive buttons |
| `--border` | `#E2E8F0` | Default borders |
| `--border-subtle` | `#E2E8F0` | Subtle structural lines |
| `--border-hover` | `#CBD5E1` | Borders on hover |
| `--input` | `#E2E8F0` | Input field borders |
| `--ring` | `#8B5CF6` | Focus ring color |

### Sidebar Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--sidebar` | `#FFFFFF` | Sidebar background (solid, no blur) |
| `--sidebar-foreground` | `#0F172A` | Sidebar text |
| `--sidebar-primary` | `#8B5CF6` | Active nav item accent |
| `--sidebar-primary-foreground` | `#FFFFFF` | Text on active nav |
| `--sidebar-accent` | `#F1F5F9` | Nav item hover background |
| `--sidebar-accent-foreground` | `#0F172A` | Nav item hover text |
| `--sidebar-border` | `#E2E8F0` | Sidebar border |
| `--sidebar-ring` | `#8B5CF6` | Sidebar focus ring |

### Semantic Colors (Muted for Light)

| Token | Hex | Usage |
|-------|-----|-------|
| `--status-healthy` | `#059669` | Stable state, healthy metrics |
| `--status-rebalancing` | `#D97706` | Rebalancing state, degraded metrics |
| `--status-dead` | `#DC2626` | Dead state, lag spikes, connection errors |
| `--status-empty` | `#9CA3AF` | Empty/inactive state |

### Chart Colors (Softer Palette)

| Token | Hex | Usage |
|-------|-----|-------|
| `--semantic-cyan` | `#06B6D4` | Secondary metrics, throughput lines |
| `--semantic-purple` | `#8B5CF6` | Primary data series |
| `--semantic-orange` | `#F59E0B` | Warning-level data, tertiary series |
| `--semantic-red` | `#DC2626` | Error-level data, alert thresholds |

## Typography

### Font Stack (Shared Dark/Light)

| Role | Font | Usage |
|------|------|-------|
| **Display** | Space Grotesk | Page titles, section headers (Bold) |
| **Body** | Inter | Labels, descriptions, nav items |
| **Mono/Data** | JetBrains Mono | Table data, metric values, broker IDs |

## Depth & Surface Logic

### Solid Surfaces + Airy Shadows
Cards and panels use solid white backgrounds with wide, soft shadows for elevation:
- **Card Shadow:** `0 10px 30px rgba(0, 0, 0, 0.05)`
- **Card Border:** `1px solid #E9ECEF`
- **Card Background:** `#FFFFFF`

### Sidebar
Solid surface, no glassmorphism blur:
- **Background:** `#F8F9FA`
- **Border:** `1px solid #E9ECEF` (right edge)

### Glass Panel (Light Variant)
The `.glass-panel` class in light mode uses solid surface + shadow instead of dark panel:
- **Background:** `#FFFFFF`
- **Border:** `1px solid #E9ECEF`
- **Shadow:** `0 10px 30px rgba(0, 0, 0, 0.05)`

## Component Patterns

### Theme Toggle
- Sun/moon icon button in `app-header.tsx`
- Single click toggles dark ↔ light
- Persists to Zustand store
- System preference detection via `prefers-color-scheme` for initial default
- Settings panel: full selector (Dark / Light / System)

### Read-Only Constraints
- **Removed:** "Create Topic" buttons, "Produce Message" modals, "Delete" actions.
- **Visible:** "Refresh" buttons, "Search" inputs, "Filter" toggles.

### Data Tables
- Header: `#F8F9FA` background, `#6B7280` text, uppercase.
- Row: `#FFFFFF` background, `#E9ECEF` border-bottom.
- Hover: `#F1F3F5` background tint.
- Links: `#8B5CF6` (primary purple) for clickable items (topic names, group IDs).
- Wrapped in card with airy shadow.

### Progress Bars (Lag Monitoring)
- **Track:** `#E9ECEF` (Soft Grey)
- **Fill:** `#8B5CF6` (Vivid Purple) — consistent regardless of severity.

### Scrollbars
- **Light mode:** Native OS scrollbars (no custom CSS).
- **Dark mode:** Custom scrollbars (`rgba(255,255,255,0.15)` thumb).

### Monaco Editor
- **Light mode:** `vs` theme (built-in light).
- **Dark mode:** `vs-dark` theme.

### Toaster
- Reads theme from Zustand store dynamically (not hardcoded).

## Animation & Interaction

### Theme Transition
- **Duration:** 300ms smooth transition on `background-color` and `color`.
- **Method:** Raw `transition:` declaration on `html` element (not Tailwind `transition-colors`).
- **Flash prevention:** Apply saved theme class before React hydration.

### General
- **Fade:** 200ms ease-in-out for page transitions.
- **Hover Scale:** Very subtle 0.98x scale on interactive cards for tactile feedback.

## Hardcoded Value Migration Map

When converting components from dark-only to dual-mode, replace these patterns:

| Hardcoded Pattern | Semantic Replacement |
|-------------------|---------------------|
| `text-slate-400` | `text-muted-foreground` |
| `text-slate-500` | `text-muted-foreground` |
| `text-slate-300` | `text-foreground` |
| `text-white` | `text-foreground` |
| `bg-white/5` | `bg-secondary` |
| `bg-white/10` | `bg-accent` |
| `border-white/5` | `border-border` |
| `border-white/10` | `border-border` |
| `hover:bg-white/10` | `hover:bg-accent` |
| `hover:text-white` | `hover:text-foreground` |
| `bg-[#141414]` | `bg-card` |
| `bg-slate-500/10` | `bg-muted` |
