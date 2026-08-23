# netgig.online — Hourly Planner
## Claude-ready UI/UX + Frontend Specification

## 0. PRODUCT

URL:

`https://netgig.online/hourly-planner/`

Product:

**Hourly Planner**

Core promise:

> Create an hour-by-hour daily plan quickly, then print or download it.

The product is a focused browser utility, not a general productivity SaaS.

Technical constraints:

- Static HTML/CSS/JS
- Vanilla JavaScript
- GitHub Pages compatible
- No framework
- No npm/build process
- No backend
- No login
- No database
- No external APIs
- Local browser persistence with `localStorage`
- Mobile-first
- A4 + US Letter print support
- Fast first paint
- No blocking onboarding
- First task should be enterable in ~10 seconds

---

# 1. VISUAL DIRECTION

The visual identity is:

**editorial stationery + physical desk planner + modern utility**

Reference ideas:

- premium paper planner
- spiral notebook
- desk stationery
- printed worksheet
- editorial magazine typography
- Japanese stationery restraint
- handwritten notes

The interface must look like a **real planning object brought into a browser**, not a generic SaaS dashboard.

Do NOT use:

- glassmorphism
- gradient hero backgrounds
- purple-blue startup gradients
- floating card soup
- excessive drop shadows
- giant pill buttons
- generic SaaS dashboard styling
- Inter/Poppins as the main typography
- decorative animation without functional purpose

---

# 2. COLOR SYSTEM

Use these core colors:

```css
:root {
  --navy: #071B2B;
  --ink: #10253A;
  --paper: #F7F3EA;
  --lime: #E8F338;
  --teal: #18A88A;

  --lavender: #DDD6FF;
  --peach: #FFD5BE;
  --sky: #D6EEF7;
  --mint: #D7F0E5;

  --danger: #E85D4A;
  --border: rgba(16, 37, 58, .14);
}
```

Primary palette is limited to navy, ink, paper, lime and teal.

Task/status colors may use the pale secondary tints.

No decorative gradients.

A single conic gradient is allowed only for the circular day-progress visualization.

---

# 3. TYPOGRAPHY

Load:

- `Bebas Neue`
- `Caveat`
- `DM Sans`

### Display

```css
font-family: "Bebas Neue", Impact, sans-serif;
font-weight: 400;
letter-spacing: -.01em;
line-height: .86;
```

Hero:

```css
font-size: clamp(3.5rem, 7vw, 6.5rem);
```

### Handwritten accent

```css
font-family: "Caveat", cursive;
font-size: 2rem;
line-height: 1;
```

Use only for short editorial accents and notes.

### UI/body

```css
font-family: "DM Sans", system-ui, sans-serif;
font-size: 1rem;
line-height: 1.45;
letter-spacing: -.01em;
```

Small UI:

```css
font-size: .78rem;
line-height: 1.3;
letter-spacing: .02em;
```

---

# 4. GLOBAL DESKTOP STRUCTURE

At desktop:

```text
┌──────────────┬────────────────────────────────────────────────┐
│              │                                                │
│  DARK NAV    │                    MAIN                        │
│              │                                                │
│              │  Utility bar                                  │
│              │  Hero                                         │
│              │  Planner tool                                 │
│              │  Feature strip                                │
│              │  Templates                                    │
│              │  Output/print CTA                             │
│              │  Footer                                       │
└──────────────┴────────────────────────────────────────────────┘
```

Sidebar:

`170px`

Main max width:

`1320px`

Main horizontal padding:

Desktop:

`28–42px`

---

# 5. SIDEBAR

Desktop:

```css
.sidebar {
  width: 170px;
  min-height: 100vh;
  background: #071B2B;
  color: #F7F3EA;
  padding: 22px 15px;
}
```

Brand:

```text
netgig.
```

Use `DM Sans`.

Final dot is `#E8F338`.

Navigation:

1. Hourly Planner
2. Templates
3. How It Works
4. Blog
5. About

Active item:

```css
background: #E8F338;
color: #071B2B;
border-radius: 8px;
```

Do not make navigation giant pills.

### Sidebar promo card

```text
GO DISTRACTION-FREE

Print your plan and
focus on what matters.

[Learn More →]
```

Use a compact dark surface with a tiny plant/desk illustration.

---

# 6. MOBILE NAV

At widths <= 767px:

- sidebar becomes a top header
- hide desktop navigation
- logo left
- Print/Download right
- optional compact menu button
- no giant navigation bar

The schedule should remain the visual center of the page.

---

# 7. TOP UTILITY BAR

Left:

```text
[offline icon] Works offline
```

Right:

```text
[printer icon] Print / Download
```

Primary print button:

```css
height: 46px;
padding-inline: 18px;
border-radius: 7px;
background: #071B2B;
color: #F7F3EA;
```

No oversized pill shape.

---

# 8. HERO

Desktop split:

- left: ~48%
- right: ~52%

### Left

Handwritten eyebrow:

```text
Your day.
```

Display headline:

```text
PLANNED
YOUR WAY.
```

Supporting copy:

```text
Free hourly planner generator.
No login. No ads. Just plan and print.
```

Four compact benefit indicators:

```text
⚡ 100% Free
🔒 No Sign Up
▣ Print to A4 / Letter
◌ Works Offline
```

These are utility indicators, not cards.

### Right

Hero illustration.

---

# 9. HERO IMAGE ASSET

Use a generated image asset.

Required visual:

- spiral notebook
- black/dark pen
- small green plant
- ceramic coffee cup
- subtle desk context
- sage brush-stroke / painted paper shape
- warm off-white background
- editorial stationery/product-photo feel
- softly imperfect hand-drawn texture
- no written words in the artwork
- no logos
- no gradients
- no people

The asset should look good on the paper-colored hero background.

Recommended dimensions:

`1200 x 900`

Use WebP.

Transparent background is preferred if the generated image supports it.

Do not attempt to recreate this illustration with CSS.

---

# 10. MAIN TOOL

The planner is the product and must visually dominate the page.

Desktop layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ date / navigation / actions                                  │
├────────────────┬──────────────────────────────┬───────────────┤
│ controls       │ hourly timeline              │ insights      │
│                │                              │               │
│ date           │ 06:00                         │ progress      │
│ time range     │ 07:00                         │ task stats    │
│ task input     │ 08:00                         │ focus mode    │
│ quick add      │ 09:00                         │ helper        │
│ view           │ ...                           │               │
└────────────────┴──────────────────────────────┴───────────────┘
```

Suggested widths:

```text
control panel: 220px
timeline: flexible
insight panel: 180px
```

---

# 11. TOOL HEADER

Left:

```text
‹   ›
Saturday, May 24, 2025   [Today]
```

Right:

```text
[Clear]
[Templates]
[Save]
```

Buttons are compact outlined controls.

---

# 12. LEFT CONTROL PANEL

### Step 1 — Set your day

```text
1. SET YOUR DAY

[ ‹ ] [ May 24, 2025 ] [ calendar ]
```

### Step 2 — Time range

```text
2. TIME RANGE

START
[06:00 AM]

END
[10:00 PM]

[ toggle ] Show 24 hours
```

### Step 3 — Add tasks

```text
3. ADD YOUR TASKS

[ e.g. Morning workout ]

[ + Add Task ]
```

Primary Add Task button:

```css
background: #18A88A;
color: white;
```

---

# 13. QUICK ADD

```text
Quick Add

[Workout] [Work] [Study]
[Meeting] [Break] [Personal]
```

Clicking a category:

1. creates a new task
2. inserts a sensible default label
3. immediately focuses task editing

No modal.

---

# 14. VIEW CONTROLS

```text
VIEW

[ Timeline View ]
[ Compact View ]
```

Optional:

```text
[ Focus Mode ]
```

Keep these visually quiet.

---

# 15. TIMELINE

The timeline is the visual centerpiece.

Time gutter:

```text
6:00 AM
7:00 AM
8:00 AM
9:00 AM
10:00 AM
...
```

Task blocks occupy actual time height.

Example:

```text
9:00 AM ┌───────────────────────────────┐
        │ Deep Work Session             │
        │                               │
        └───────────────────────────────┘
```

Task block:

```css
border-radius: 5px;
border-left: 4px solid currentColor;
```

Inside:

```text
▌  Deep Work Session            120m  ⋮
```

Task card contains:

- colored stripe
- icon
- title
- duration
- overflow menu

Avoid giant rounded cards.

---

# 16. CURRENT-TIME INDICATOR

Show a thin horizontal line across the timeline.

Example:

```text
2:30 PM  ─────────────────────────────────
```

Use:

```css
--danger: #E85D4A;
```

Line should update from browser local time.

No continuous animation.

---

# 17. RIGHT INSIGHT PANEL

Desktop only.

### Day Progress

Circular ring:

```text
62%

10h 30m / 17h
```

Use a conic-gradient only here.

### Task stats

```text
✓ Completed      3
▶ In Progress    1
○ Pending        7
```

### Focus mode card

```text
Hide distractions
and focus on the now.

[Start Focus]
```

### Drag/drop helper

```text
Drag tasks to reschedule
or change the duration.
```

Use a small line illustration.

---

# 18. INTERACTIONS

## Quick-add behavior

Pressing Enter on task input:

- saves task
- inserts next task row
- moves focus to next row

Goal:

**one task = one short interaction**

## Drag & drop

Dragging changes start time.

Duration remains unchanged.

## Resize

Desktop:

- resize handle at top/bottom of task

Mobile:

- duration control instead of tiny drag handles

## Free-time detection

Show gaps as:

```text
FREE — 60 MIN
```

Clicking the gap converts it into a task block.

## Focus Mode

When activated:

- hide sidebar
- hide non-current tasks
- enlarge current task
- show next task
- preserve task completion
- Escape exits Focus Mode

---

# 19. TEMPLATE SECTION

Headline:

```text
START FASTER WITH TEMPLATES
```

Five templates:

1. Workday Schedule
2. Student Schedule
3. Freelancer Plan
4. 24 Hour Schedule
5. Shift Schedule

Each card has:

- title
- short descriptor
- tiny planner preview

Clicking loads the template into the generator.

---

# 20. TEMPLATE VISUALS

Do not use generic stock images.

Each preview should look like a miniature printed planner.

Use:

- warm white paper
- fine grid lines
- miniature schedule blocks
- simple labels
- realistic page proportions

Preview assets can be generated illustrations.

---

# 21. OUTPUT CTA

Use a full-width navy section.

Headline:

```text
Plan once.
Stay in control.
```

Subcopy:

```text
Create your ideal day, every day.
```

Primary CTA:

```text
Start Planning Now →
```

Three output cards:

### One-Click Print

```text
Clean layout optimized
for A4 & Letter.
```

### Download PDF

```text
Save your plan as PDF.
```

### Download Image

```text
Save as PNG for sharing
or backup.
```

Right-side decorative image:

Small handwritten sticky-note illustration:

```text
Your plan.
Your paper.
Your success.
```

---

# 22. FOOTER

Minimal.

```text
© 2025 netgig.online

Privacy Policy
Terms
Contact
```

Keep it compact.

---

# 23. MOBILE

At <= 767px:

Hero order:

1. eyebrow
2. headline
3. supporting text
4. benefits
5. illustration

Planner order:

1. date
2. time range
3. task input
4. quick add
5. timeline
6. stats
7. focus mode

Do not simply stack the desktop three-column dashboard.

Timeline:

- time label on left
- task block on right
- minimum task target height: 52px

Templates:

horizontal scroll carousel.

---

# 24. PRINT

Use:

```css
@page {
  size: A4 portrait;
  margin: 12mm;
}
```

Also ensure Letter is supported.

Hide during print:

- sidebar
- hero
- navigation
- controls
- template gallery
- CTA
- decorative images
- menus
- focus controls

Show:

- planner title
- date
- timeline
- task names
- times
- notes/status if useful

Printed background:

`#FFFFFF`

Printed text:

`#000000`

Do not communicate critical information with color alone.

---

# 25. PRINT DESIGN

Printed output should resemble a professional paper planner.

Header:

```text
HOURLY PLANNER
Saturday, May 24, 2025
```

Then:

```text
TIME | SCHEDULE
```

Task cells:

- white background
- thin borders
- strong readable labels
- enough writing space
- grayscale-safe

---

# 26. ACCESSIBILITY

Minimum touch target:

`44px × 44px`

Visible keyboard focus:

```css
outline: 3px solid #E8F338;
outline-offset: 2px;
```

Keyboard:

- Enter = save task
- Escape = exit focus mode
- Tab follows logical order

Labels must be accessible.

Do not rely on color alone.

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

---

# 27. PERFORMANCE

Target:

**first meaningful UI under 1 second on a normal mobile connection**

Rules:

- no framework
- no build step
- no animation libraries
- no video
- hero image compressed
- below-fold images lazy-loaded
- inline SVG icons
- avoid layout shifts
- font fallback must remain readable while Google Fonts load
- do not preload unnecessary assets

---

# 28. LOCAL DATA MODEL

Persist planner state using `localStorage`.

Example:

```js
{
  date: "2025-05-24",
  startTime: "06:00",
  endTime: "22:00",
  interval: 60,
  tasks: [
    {
      id: "task-1",
      title: "Morning Workout",
      start: "06:00",
      duration: 60,
      category: "workout",
      status: "pending",
      notes: ""
    }
  ]
}
```

Autosave after meaningful changes.

---

# 29. FIRST-USE EXPERIENCE

No onboarding.

No popup.

No signup.

No “choose a template first”.

No tutorial carousel.

The initial state should already contain a usable schedule framework.

Ideal flow:

```text
Open
→ see today's date
→ see default hours
→ type first task
→ press Enter
→ task appears
```

Target:

**first task in ~10 seconds**

---

# 30. SEO

Primary page:

`/hourly-planner/`

Title:

```text
Free Hourly Planner – Create an Hour-by-Hour Schedule
```

H1:

```text
PLANNED
YOUR WAY.
```

Tool title:

```text
Hourly Planner
```

Potential supporting pages only after validating independent intent:

```text
/hourly-schedule/
/hourly-schedule-template/
/daily-hourly-schedule/
/hour-by-hour-schedule/
/24-hour-schedule/
```

Never create thin duplicate pages.

Each page must offer a distinct use case, output or default configuration.

---

# 31. ASSET SYSTEM

Use generated imagery only for visual components that benefit from actual illustration.

Required assets:

```text
assets/
├── hero-desk.webp
├── sidebar-desk.webp
├── sticky-note.webp
├── template-workday.webp
├── template-student.webp
├── template-freelancer.webp
├── template-24-hour.webp
└── template-shift.webp
```

All assets should share:

- same editorial stationery language
- warm paper background
- navy/teal/lime accent system
- subtle handmade texture
- no text inside artwork unless specifically requested
- no branding embedded in images
- no UI screenshots inside the artwork

---

# 32. DO NOT USE IMAGES FOR THESE

These should remain CSS/HTML:

- buttons
- cards
- task blocks
- grids
- icons
- separators
- progress ring
- badges
- navigation
- layout
- background blocks
- typography
- print layout

---

# 33. IMPLEMENTATION ORDER

Build in this order:

1. Core planner interaction
2. Mobile layout
3. Timeline rendering
4. Add/edit/delete
5. Drag/reschedule
6. Local storage
7. Print system
8. Templates
9. Focus mode
10. Desktop visual polish
11. Hero and illustration integration
12. SEO content
13. Secondary pages

Do not spend the first implementation phase polishing the hero while the planner itself is incomplete.

---

# 34. DESIGN SUCCESS TEST

The final page should feel like:

**a physical premium planner translated into a browser utility**

not:

**a productivity SaaS landing page**

The key test is:

> Can a first-time user understand what to do and enter their first task without instructions?

Second test:

> Does the generated page look good enough to print and actually keep on a desk?

Third test:

> Does the interface feel meaningfully more direct than opening Canva, Notion, Excel or a full calendar app?

The visual system should support those three outcomes.
