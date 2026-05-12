# Design Guidelines — Luminous Stream (Light Version)

## Brand Identity

| Element | Value |
|---------|-------|
| **Theme Name** | Luminous Stream |
| **Primary Color** | `#8B5CF6` (Vivid Purple) |
| **Background** | `#FFFFFF` (Pure White) |
| **Personality** | Airy, minimalist, high-clarity, professional observability |
| **Mode** | Dual-mode (dark + light) with header icon toggle |

## Color System

### Core Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#FFFFFF` | Main app background |
| `--foreground` | `#1A1A2E` | Primary text color |
| `--primary` | `#8B5CF6` | Accent, links, active navigation, primary CTAs |
| `--primary-foreground` | `#FFFFFF` | Text on primary buttons |
| `--card` | `#FFFFFF` | Card backgrounds (with airy shadow) |
| `--card-foreground` | `#1A1A2E` | Card text |
| `--popover` | `#FFFFFF` | Popover/dropdown backgrounds |
| `--popover-foreground` | `#1A1A2E` | Popover text |
| `--secondary` | `#F1F3F5` | Secondary backgrounds, subtle interactive fills |
| `--secondary-foreground` | `#1A1A2E` | Text on secondary surfaces |
| `--muted` | `#F8F9FA` | Muted backgrounds, table headers |
| `--muted-foreground` | `#6B7280` | Labels, descriptions, secondary text |
| `--accent` | `#F1F3F5` | Hover states, active backgrounds |
| `--accent-foreground` | `#1A1A2E` | Text on accent surfaces |
| `--destructive` | `#DC2626` | Delete actions, error states |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive buttons |
| `--border` | `#E9ECEF` | Default borders |
| `--border-subtle` | `#E9ECEF` | Subtle structural lines |
| `--border-hover` | `#CED4DA` | Borders on hover |
| `--input` | `#E9ECEF` | Input field borders |
| `--ring` | `#8B5CF6` | Focus ring color |

### Sidebar Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `--sidebar` | `#F8F9FA` | Sidebar background (solid, no blur) |
| `--sidebar-foreground` | `#1A1A2E` | Sidebar text |
| `--sidebar-primary` | `#8B5CF6` | Active nav item accent |
| `--sidebar-primary-foreground` | `#FFFFFF` | Text on active nav |
| `--sidebar-accent` | `#F1F3F5` | Nav item hover background |
| `--sidebar-accent-foreground` | `#1A1A2E` | Nav item hover text |
| `--sidebar-border` | `#E9ECEF` | Sidebar border |
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
- **Duration:** 300ms smooth transition on `background-color`, `color`, `border-color`, `box-shadow`.
- **Method:** `transition-colors duration-300` on `<html>` element.
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
