# 🎨 Bookmarks Feature - Visual Design Guide

## 📱 Main Bookmarks Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Logo              [Navigation Menu]         [Profile ▼]    │
│                    Movies Series Games Bookmarks Settings    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔖 My Bookmarks                          [Search...] [Sort▼]│
│     28 items in favorite                                     │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  STATUS TABS (with counters):                               │
│  ⭐ Favorite (5) │ ▶️ Watching (12) │ 📋 Planned (3) │...  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  CONTENT GRID (Responsive):                                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  [Poster]    │  │  [Poster]    │  │  [Poster]    │       │
│  │  ⭐⭐⭐⭐⭐ │  │  ⭐⭐⭐⭐⭐ │  │  ⭐⭐⭐⭐⭐ │       │
│  │  Title       │  │  Title       │  │  Title       │       │
│  │  Genre • Year│  │  Genre • Year│  │  Genre • Year│       │
│  │  ★★★★☆ 8/10 │  │  ★★★★☆ 8/10 │  │  ★★★★☆ 8/10 │       │
│  │  Progress:   │  │  Progress:   │  │  Progress:   │       │
│  │  ████░░░░░░░│  │  ████░░░░░░░│  │  ████░░░░░░░│       │
│  │  5/12 Ep.   │  │  5/12 Ep.   │  │  5/12 Ep.   │       │
│  │  Note: ...   │  │  Note: ...   │  │  Note: ...   │       │
│  │  [★] [✕]    │  │  [★] [✕]    │  │  [★] [✕]    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  [Poster]    │  │  [Poster]    │  │  [Poster]    │       │
│  │  ...         │  │  ...         │  │  ...         │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Status Categories with Colors

### Dark Theme Colors:
```
⭐ FAVORITE        Purple (#A855F7)
   Icon: ⭐
   Background: rgba(168, 85, 247, 0.1)
   Border: #A855F7
   Use: Mark your absolute favorites

▶️ WATCHING        Green (#22C55E)
   Icon: ▶️
   Background: rgba(34, 197, 94, 0.1)
   Border: #22C55E
   Use: Currently watching/reading/playing

📋 PLANNED         Red (#EF4444)
   Icon: 📋
   Background: rgba(239, 68, 68, 0.1)
   Border: #EF4444
   Use: Want to watch later

✓ WATCHED          Gray (#6B7280)
   Icon: ✓
   Background: rgba(107, 114, 128, 0.1)
   Border: #6B7280
   Use: Already completed

⏸️ POSTPONED       Orange (#F97316)
   Icon: ⏸️
   Background: rgba(249, 115, 22, 0.1)
   Border: #F97316
   Use: Temporarily paused

✗ DROPPED         Dark Red (#DC2626)
   Icon: ✗
   Background: rgba(220, 38, 38, 0.1)
   Border: #DC2626
   Use: Stopped watching
```

## 📱 Responsive Grid Layouts

### Mobile (< 640px)
```
1 column grid
Full width cards
Compact headers
Touch-friendly buttons (44px+)

┌──────────┐
│ [Poster] │
│ Title... │
│ ...      │
└──────────┘
```

### Tablet (640-1024px)
```
2 column grid
Better spacing
Full navigation visible

┌──────────┐ ┌──────────┐
│ [Poster] │ │ [Poster] │
│ Title... │ │ Title... │
│ ...      │ │ ...      │
└──────────┘ └──────────┘
```

### Desktop (> 1024px)
```
3-4 column grid
Maximum information density
All controls visible

┌──────────┐ ┌──────────┐ ┌──────────┐
│ [Poster] │ │ [Poster] │ │ [Poster] │
│ Title... │ │ Title... │ │ Title... │
│ ...      │ │ ...      │ │ ...      │
└──────────┘ └──────────┘ └──────────┘
```

## 🎬 Content Card Anatomy

```
┌─────────────────────────────────┐
│ [POSTER IMAGE]         [Status] │
│                                  │
│                                  │
│ [⭐ Favorite Button]             │
│                        [✕ Delete]│
├─────────────────────────────────┤
│ Title: Inception                │
│ Movie • Action • 2010            │
│                                  │
│ Rating (External): ★★★★☆ 8.8/10│
│                                  │
│ Your Rating: ★★★★☆ 8/10         │
│                                  │
│ Progress:                        │
│ [━━━━░░░░░░░░░░░░] 5/12        │
│ [−] [+]                         │
│                                  │
│ Notes: "Incredible film!"        │
│                                  │
└─────────────────────────────────┘
```

## 🌙 Theme Switcher in Settings

### Light Theme
```
┌──────────────────────────────┐
│ Display Settings             │
├──────────────────────────────┤
│                              │
│ ☀️  Theme                    │
│     Light theme enabled    [●|○] │
│                              │
│ 🔊 Sound Effects           [●|○] │
│    Enable sound...          │
│                              │
│ 👁️ Animations              [●|○] │
│    Show smooth animations   │
│                              │
│ 👁️ Compact Mode            [○|●] │
│    Use compact layout        │
│                              │
│              [Save Settings] │
└──────────────────────────────┘
```

### Dark Theme
```
┌──────────────────────────────┐
│ Display Settings             │
├──────────────────────────────┤
│                              │
│ 🌙 Theme                     │
│    Dark theme enabled      [○|●] │
│                              │
│ 🔊 Sound Effects           [●|○] │
│    Enable sound...          │
│                              │
│ 👁️ Animations              [●|○] │
│    Show smooth animations   │
│                              │
│ 👁️ Compact Mode            [○|●] │
│    Use compact layout        │
│                              │
│              [Save Settings] │
└──────────────────────────────┘
```

## 🎯 Status Tabs with Counters

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ⭐          ▶️         📋         ✓        ⏸️      ✗   │
│ Favorite    Watching   Planned   Watched  Paused  Dropped │
│    5          12          3         8         2       1   │
│                                                    │
└────────────────────────────────────────────────────┘

Active Tab (Favorite):
- Purple border bottom
- Purple background
- White text
```

## 🔍 Search & Sort Controls

```
┌─────────────────────────────────────────┐
│                                         │
│  🔍 Search bookmarks...   [Sort ▼]    │
│                          ↓ Date/Rating│
│                          ↓ Progress   │
│                                         │
└─────────────────────────────────────────┘
```

## 📊 Empty State

```
┌──────────────────────────┐
│                          │
│           ⭐             │
│                          │
│   No Favorite Content    │
│                          │
│  Add new favorite items  │
│  to see them here        │
│                          │
└──────────────────────────┘
```

## 🎨 Material Design 3 Effects

### Hover Effects
```
On Card:
- Shadow increases
- Image scales up 110%
- Border color intensifies
- Delete button appears
- Smooth transition (300ms)

On Button:
- Color transitions to primary
- Slight scale (105%)
- Smooth transition (200ms)
```

### Focus States
```
- Outline color = primary
- Ring-2 ring-primary/50
- Keyboard navigation highlighted
```

### Transitions
```
Colors: 300ms ease
Shadows: 300ms ease
Transform: 300ms ease
Opacity: 200ms ease
```

## 🌐 Color Palette

### Light Theme
- Background: White (#FFFFFF)
- Surface: Gray (#F3F4F6)
- Primary: Purple (#9333EA)
- Text: Gray (#111827)
- Muted: Gray (#9CA3AF)

### Dark Theme
- Background: Dark (#0F172A)
- Surface: Gray (#1E293B)
- Primary: Purple (#A855F7)
- Text: White (#F8FAFC)
- Muted: Gray (#94A3B8)

## 📸 Typography

```
Headings:     Bold, 24px (Bookmarks page)
Titles:       Bold, 16px (Card titles)
Description:  Regular, 14px (Metadata)
Labels:       Medium, 12px (Tags, stats)
```

---

**All designs follow Material Design 3 guidelines for consistency and familiarity!**
