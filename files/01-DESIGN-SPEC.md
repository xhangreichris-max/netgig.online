# Hourly Planner: Design Spec

Follow this exactly. Do not substitute fonts, colors, or spacing values.

---

## The design opinion

Every free hourly planner on the internet looks like a craft project.
Pastel borders, script fonts, decorative headers, sticker aesthetics.
That look serves the bullet-journal audience, and that audience is already
well served by Pinterest and Etsy.

This tool looks like a **printed timetable**.

The reference point is not a website. It is the world of institutional
scheduling: railway departure boards, film production call sheets, hospital
shift handover boards. Documents built to be read fast, printed cheaply, and
written on with a pen.

That look is absent from this SERP. It also serves the workday and freelance
audience far better than a decorated planner does, and that audience is the
one with commercial value.

---

## The signature element: the now line

A single horizontal rule sits across the schedule at the current time and
moves down through the day in real time, the way a departure board marks the
next train.

On screen it is live, updating every minute.
On print it freezes at the moment of printing, with the timestamp beside it.

This is the one memorable thing. Everything else stays quiet.

Nothing else in this SERP does this. It costs very little to build and it is
the detail people will describe when they tell someone about the tool.

---

## Color

Five values. No gradients. No shadows beyond a single hairline.

```css
:root {
  --ink:        #16161A;  /* body text, rules, task text */
  --paper:      #FBFBF9;  /* page background */
  --rule:       #DADAD4;  /* hour dividers, borders */
  --quiet:      #6B6B66;  /* labels, meta, empty states */
  --pen:        #0369A1;  /* now line, focus rings, active state */
}
```

The accent is called `--pen` because it is ballpoint blue. The product's
whole thesis is that you print the page and write on it, so the one colored
element on screen is the color of the pen you will pick up afterward.

Contrast: `--ink` on `--paper` is roughly 15.8:1. `--quiet` on `--paper`
clears 5:1. Both pass AA comfortably.

Print rule: `--pen` renders as mid-gray on monochrome printers. Never encode
meaning in color alone. The now line also carries a printed timestamp label.

---

## Typography

Two families from Google Fonts. Nothing else.

```css
--font-data: 'IBM Plex Mono', ui-monospace, monospace;
--font-text: 'IBM Plex Sans', system-ui, sans-serif;
```

IBM Plex was drawn for an engineering company and carries that character.
It reads as instrument, not as decoration, which is the whole point.

Times, durations, and all numerals use the mono face. Task text, labels, and
page copy use the sans face. That split is not stylistic. It encodes the
difference between the fixed structure of the day and the variable content
the user puts into it.

### Scale

```css
--size-h1:    2.25rem;   /* 36px, page title */
--size-h2:    1.375rem;  /* 22px, section heads */
--size-body:  1rem;      /* 16px, task text */
--size-time:  0.875rem;  /* 14px, hour labels, mono */
--size-small: 0.8125rem; /* 13px, meta, hints */
```

```css
h1 { line-height: 1.1;  letter-spacing: -0.02em; font-weight: 600; }
h2 { line-height: 1.25; letter-spacing: -0.01em; font-weight: 600; }
body { line-height: 1.5; letter-spacing: 0; font-weight: 400; }
.time { line-height: 1;  letter-spacing: 0.02em; font-weight: 500; }
```

Hour labels get positive tracking because mono numerals read better with
air between them at small sizes on a dense grid.

---

## Layout

The schedule is a two-column grid. Time on the left, content on the right.
This mirrors every physical timetable ever printed and needs no explanation.

```
┌──────────────────────────────────────────────┐
│  HOURLY PLANNER            Thu 16 Aug 2026   │  ← header, sans
├──────────────────────────────────────────────┤
│  [ 08:00 ▾ ]  to  [ 18:00 ▾ ]   [ 30 min ▾ ] │  ← controls, mono
├────────┬─────────────────────────────────────┤
│ 08:00  │ Review inbox                        │
│ 08:30  │ Draft proposal                      │
│────────┼─────────────────────────────────────│  ← now line, pen blue
│ 09:00  │ Client call                         │
│ 09:30  │ ·  free  ·                          │  ← detected gap, quiet
│ 10:00  │ ▏                                   │  ← quick-add row, cursor
└────────┴─────────────────────────────────────┘
```

### Measurements

```css
--col-time:    5.5rem;    /* fixed time column width */
--row-min:     2.75rem;   /* minimum row height, grows with content */
--gutter:      1rem;
--page-max:    52rem;     /* content max width */
```

Time column is fixed so hour labels align vertically down the whole page.
Rows have a minimum height but grow, which is what makes Auto-Fit work
without any JavaScript measuring anything.

### Mobile

Below 640px the time column narrows to `4rem` and the interval control
collapses into the same row as the time pickers. The grid structure does not
change. A timetable is already a mobile-friendly shape.

---

## Interaction detail

### Quick-add row

An empty row always sits at the next unfilled slot with a live cursor. The
user types and presses Enter. The row commits and a new empty row appears
below it, already focused.

There is no add button. There is no modal. Entering ten tasks is ten lines
of typing and ten presses of Enter.

Implementation: event delegation on the schedule container, `keydown` for
Enter, focus moved programmatically to the next row.

### Auto-fit

Task cells use CSS grid rows with `min-height` rather than fixed height.
Long text wraps and the row grows. The time column label stays top-aligned so
the hour marker never drifts away from its slot.

No `ResizeObserver`. No JavaScript measurement. CSS handles it.

### Free-time detection

After any edit, sort blocks by start time and walk the list looking for
gaps. Render each gap as a non-editable row reading `· free ·` in `--quiet`.
Clicking it turns it into a normal editable row.

This is the feature that makes the tool feel like it is paying attention.

### Focus

Visible focus rings in `--pen`, 2px, offset 2px. Never remove outlines.
Tab order runs down the schedule in time order, which is the order a person
reads it.

---

## Print stylesheet

Print is not an afterthought. It is the product's output format.

```css
@media print {
  /* hidden */
  header nav, .controls, .site-footer,
  .related-tools, .quick-add-row { display: none; }

  /* page */
  @page { margin: 15mm; size: auto; }
  body { background: #fff; color: #000; font-size: 11pt; }

  /* structure survives */
  .schedule-row { break-inside: avoid; }
  .now-line { border-top: 2px solid #000; }

  /* writing space */
  .schedule-row { min-height: 14mm; }
}
```

Rows get a taller minimum in print because the printed page exists to be
written on. Fourteen millimetres is enough for a line of handwriting.

Test on both A4 and Letter. Test with the browser's default margins and with
margins off.

---

## Copy voice

Plain, short, functional. The interface speaks in the register of a well
made instrument, not a productivity brand.

```
Good:  "Print schedule"        Bad: "Export your beautiful plan"
Good:  "8:00 to 18:00"         Bad: "Your Perfect Workday"
Good:  "· free ·"              Bad: "Open time for whatever sparks joy"
Good:  "Nothing scheduled yet. Start typing."
Bad:   "Oops! Looks like your day is empty!"
```

Empty states give direction. Errors state what happened. Nothing apologizes.

---

## What to avoid

No gradient heroes. No glassmorphism. No floating cards with soft shadows.
No purple-to-blue anything. No Inter, no Poppins. No emoji in the interface.
No animated illustrations. No decorative borders.

If a design decision could appear unchanged on a different product in a
different category, it is the wrong decision for this one.
