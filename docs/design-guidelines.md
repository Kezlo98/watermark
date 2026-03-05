# Design Guidelines

## Brand Identity

| Element | Value |
|---------|-------|
| **App Name** | Watermark |
| **Tagline** | Dev Infra |
| **Primary Color** | `#8B5CF6` (Violet 500) |
| **Background** | `#0A0A0A` (near-black) |
| **Personality** | Technical, premium, data-dense, dark-first |

## Color System

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#8B5CF6` | Accent, active nav, CTAs, controller highlight |
| `background-dark` | `#0A0A0A` | App background |
| `background-light` | `#F5F8F8` | Light theme background |
| `glass-panel` | `#141414` | Card/panel backgrounds |
| `border-subtle` | `rgba(255,255,255,0.1)` | Panel borders |
| `border-hover` | `rgba(255,255,255,0.2)` | Hover state borders |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `semantic-cyan` | `#00FFFF` | Topics, partitions, data metrics |
| `semantic-purple` | `#BF00FF` | Schemas, ACLs |
| `semantic-orange` | `#FF8C00` | Consumer groups, warnings |
| `semantic-red` | `#FF0000` | Errors, lag > 0, danger actions |
| `emerald-400` | `#34D399` | Healthy/Online status |

### Cluster Color Tags (Settings Page)

Clusters can be tagged with colors that tint the top navbar as a **visual safety warning**:
- **Red** → Production cluster (navbar tinted red)
- **Orange** → Staging
- **Green** → Development
- **Default (purple)** → No tag

### State Colors

| State | Badge Color | Icon |
|-------|-------------|------|
| 🟢 Healthy / Stable / Online | Emerald | `check_circle` |
| 🟡 Rebalancing / Degraded | Amber | `sync` |
| 🔴 Dead / Offline / Error | Red | `error` |
| ⚪ Empty / Unknown | Slate | `radio_button_unchecked` |

## Typography

### Font Stack

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Display** | Inter or Space Grotesk | 600-700 | Page titles, section headers |
| **Body** | Inter | 400-500 | Labels, descriptions, nav items |
| **Mono/Data** | JetBrains Mono | 400-700 | Table data, metric values, code, broker IDs |
| **Editor** | Configurable (Settings Tab 2) | — | Monaco Editor; user can set custom monospace + size (12-16px) |

### Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 30px | 700, mono, uppercase | Page titles ("CLUSTER OVERVIEW") |
| H2 | 24px | 700 | Section headers |
| H3 | 18px | 600 | Card titles, table headers |
| Body | 14px | 400 | Default text |
| Small | 12px | 500 | Badges, status labels, secondary text |
| XS | 10px | 600 | Uppercase tracking labels |

## Layout System

### App Shell

```
┌─────────────────────────────────────────────────┐
│ Sidebar (264px)  │  Header (64px, sticky)       │
│                  ├──────────────────────────────│
│  Logo + Nav      │  Main Content Area           │
│                  │  (scrollable, p-8)           │
│  - Overview      │  max-w: 1280px, centered     │
│  - Topics        │                              │
│  - Consumers     │                              │
│  - Schemas       │                              │
│                  │                              │
│  [bottom: ver]   │                              │
└──────────────────┴──────────────────────────────┘
```

### Header Bar
- Left: Cluster selector dropdown (click to switch), Global search (Cmd+K)
- Right: Notifications, Settings gear, colored cluster tag indicator, `[+ New Resource]`

### UI Density Modes (Settings Tab 2)

| Mode | Row Height | Padding | Use Case |
|------|-----------|---------|----------|
| Compact | 36px | py-2 px-4 | Power users, many rows visible |
| Comfortable | 48px | py-3 px-6 | Default, balanced |
| Spacious | 56px | py-4 px-6 | Presentation, accessibility |

## Component Patterns

### Glass Panel (Primary Container)
```css
.glass-panel {
  background: #141414;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px; /* rounded-2xl */
}
```

### Glass Sidebar
```css
.glass-sidebar {
  background: rgba(10, 10, 10, 0.4);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Metric Card
- Glass panel container
- Top row: label (slate-400, mono, sm) + icon (colored bg/10, rounded-lg)
- Value: 2xl mono bold
- Trend line: colored text with trending arrow icon

### Data Tables
- Header: `bg-white/5`, uppercase mono text, tracking-wider
- Rows: `hover:bg-white/5` transition, cursor-pointer
- Dividers: `divide-y divide-white/5`
- Active controller row: highlighted with primary accent
- ISR mismatch: highlighted row with semantic-red background tint

### Status Badge
```html
<span class="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary 
             rounded-full text-xs font-semibold border border-primary/20">
  <span class="size-2 rounded-full bg-primary animate-pulse"></span>
  Operational
</span>
```

### Tab Navigation (Topic Detail, Settings)
- Horizontal tabs for Topic Detail (Messages, Consumers, Partitions, Configuration, ACL)
- Vertical/left tabs for Settings overlay (Clusters, Appearance, Data & System)
- Active tab: primary color underline/highlight
- Inactive: slate-400, hover to slate-200

### Disabled Button Pattern
- Visual: reduced opacity (0.5), cursor-not-allowed
- Tooltip: explains why disabled (e.g., "Group must be Empty or Dead to reset offsets")

### Config Override Highlight
- Default values: normal text color
- Overridden config: primary-colored left border + subtle background tint

## Page-Specific Design Notes

### Page 1: Dashboard
- Hero metrics as 4-column card grid
- Brokers table with controller node highlighted (primary accent row)

### Page 2: Topics Index
- Filter bar: search input + "Hide Internal Topics" toggle + Create button
- Dense sortable table with inline topic metrics

### Page 3: Topic Detail
- Full-width tabbed interface
- Messages tab: live-tail grid capped at 100 rows, click-to-inspect JSON pane
- Format selector dropdown (Auto, String, JSON, Avro, Protobuf, Hex)
- Produce Message modal with partition selector, key/value inputs, headers

### Page 4: Consumer Groups
- State badges with colored dots matching state (Stable/Rebalancing/Dead/Empty)
- Total Lag cell: red text + bold when lag > 0

### Page 5: Consumer Group Detail
- Header stats cards (State, Coordinator Broker)
- Two sections: Active Members table, Offsets & Lag table
- Reset Offsets button: disabled with tooltip when group is Active

### Page 6: Schema Registry
- Split-pane layout: subject list (left), schema viewer (right)
- Version dropdown + Compatibility badge in right pane header
- Monaco Editor in read-only mode for schema definition

### Page 7: Settings
- Full-screen overlay or large modal
- Left-tab navigation: Clusters | Appearance & Editor | Data & System
- Cluster form: color tag picker, read-only toggle, SASL dropdown, test connection button
- Appearance: theme switcher, density selector, font config
- Data: import/export with password inclusion toggle, startup behavior

## Animation & Interaction

| Element | Animation |
|---------|-----------|
| Status dots | `animate-pulse` (subtle glow) |
| Panel hover | `transition-colors` (150ms) |
| Nav items | Color transition on hover (200ms) |
| Modals | Fade-in + scale-up (150ms) |
| Tab content | Cross-fade (100ms) |
| Toasts | Slide-in from top-right, auto-dismiss 5s |
| Sidebar collapse | Width transition (200ms) |

## Icons

- **System**: Material Symbols Outlined (variable weight)
- **App UI**: Lucide React (consistent stroke width)
- **Key icons**: `water_drop` (logo), `dashboard`, `layers` (topics), `group` (consumers), `schema`, `settings`, `search`, `notifications`

## Responsive Behavior

Desktop-only application — no mobile breakpoints needed. However:
- Sidebar can collapse to icon-only mode at narrow window widths
- Metric cards stack 2×2 at window width < 1200px
- Tables scroll horizontally if needed
- Monaco Editor adapts to available width
