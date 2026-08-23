# Hourly Planner: Build Spec

Technical architecture and implementation order. Work through the steps in
sequence. Do not skip ahead.

---

## Repository structure

```
netgig.online/
├── build.py                 # page generator
├── pages-config.json        # per-page configuration
├── template.html            # shared page template
├── template_index.html      # site index template
├── src/
│   ├── style.css            # all styles including print
│   ├── planner.js           # generator logic
│   └── favicon.svg
├── docs/                    # GitHub Pages output directory
├── .github/workflows/
│   └── build.yml            # build and deploy on push
├── README.md                # includes kill criteria
├── sitemap.xml              # generated
├── robots.txt
└── llms.txt
```

This mirrors the pattern already in use on aifontsgenerator.com. Do not
invent a new architecture.

---

## Core principle

**One generator, many pages.**

`planner.js` contains a single implementation. Each landing page passes
different defaults through data attributes on the schedule container. There
is no duplicated logic and no per-page JavaScript.

```html
<div id="schedule"
     data-start="08:00"
     data-end="18:00"
     data-interval="30"
     data-variant="standard">
</div>
```

`planner.js` reads those attributes on load and configures itself. Adding a
new landing page means adding an entry to `pages-config.json`, nothing more.

---

## pages-config.json shape

```json
{
  "base_url": "https://netgig.online",
  "pages": [
    {
      "slug": "hourly-planner",
      "title": "Free Hourly Planner - Make a Daily Schedule and Print It",
      "h1": "Hourly Planner",
      "description": "Build an hour-by-hour daily schedule in your browser and print it. No account, no setup.",
      "start": "08:00",
      "end": "18:00",
      "interval": 30,
      "variant": "standard",
      "intro": "",
      "faq": [],
      "related": ["hour-by-hour-schedule", "24-hour-schedule"]
    }
  ]
}
```

Every field that appears on a page comes from this file. `template.html`
contains no hardcoded copy.

---

## Implementation order

### Step 1: Static shell

Build one page by hand at `docs/hourly-planner/index.html`. No generator yet.
Hardcode everything. Get the layout, typography, and grid correct against
`01-DESIGN-SPEC.md`.

Do not move to Step 2 until the page looks right on desktop and mobile with
no JavaScript running at all.

### Step 2: Print stylesheet

Before adding any interactivity, make the static page print correctly.
Test A4 and Letter. Test in Chrome and Firefox.

Printing is the product's output. If it does not print well, nothing else
matters.

### Step 3: Schedule rendering

Write `planner.js`. On load, read the data attributes, calculate the time
slots between start and end at the given interval, and render rows.

State lives in a single array of objects held in memory:

```js
let blocks = [
  { time: "08:00", text: "", type: "slot" }
];
```

No localStorage. No sessionStorage. State resets on reload and that is
correct behavior for this tool.

### Step 4: Quick-add row

Event delegation on `#schedule`. Listen for `keydown`. On Enter, commit the
current row, append a new empty row, move focus to it.

Test: entering ten tasks should require no mouse contact at all.

### Step 5: Auto-fit

Pure CSS. Grid rows with `min-height`, content-driven growth, time label
top-aligned. Verify a task of two hundred characters does not break the
grid alignment.

### Step 6: Free-time detection

After every commit, sort `blocks` by time and walk for gaps. Insert rows of
`type: "free"`. Render them non-editable in `--quiet`. Click promotes them to
editable slots.

### Step 7: The now line

Read `new Date()`. Find the slot the current time falls into. Insert the
now line rule at that position. Update on a `setInterval` of 60 seconds.

On `beforeprint`, freeze the position and inject the timestamp label. On
`afterprint`, resume live updating.

```js
window.addEventListener('beforeprint', freezeNowLine);
window.addEventListener('afterprint', resumeNowLine);
```

### Step 8: The generator

Now write `build.py`. It reads `pages-config.json`, fills `template.html`,
and writes to `docs/`. Generate the remaining three landing pages.

Also generate `sitemap.xml` from the same config. Never maintain the sitemap
by hand.

### Step 9: Deploy

GitHub Actions workflow that runs `build.py` on push to main and publishes
`docs/`.

### Step 10: Search Console

Add the property. Submit the sitemap. Request indexing on all four pages.

Do this on launch day, not later. This step was the bottleneck on a previous
project and it is trivial to do early.

---

## Non-negotiable technical requirements

```
No framework
No npm, no bundler, no build step other than build.py
No localStorage or sessionStorage
No external API calls
No web fonts beyond the two IBM Plex families from Google Fonts
Total page weight under 100KB excluding fonts
First contentful paint under 1 second on 3G
Works with JavaScript disabled: the page renders a static empty grid
```

That last one matters more than it looks. A crawler that does not execute
JavaScript should still see a real hourly grid with real time labels in the
HTML. Render the default grid server-side in `build.py` and let
`planner.js` take over on load.

This is the same lesson as the hardcoded Unicode previews on
aifontsgenerator.com. Crawlers need to see content in raw HTML.

---

## Technical SEO, day one

Do all of this before launch. Retrofitting is what caused the canonical
drift problem on a previous project.

```
Canonical tag on every page, absolute URL, trailing slash consistent
One URL variant only, no extensionless duplicates
sitemap.xml generated from pages-config.json
robots.txt allowing all, pointing to sitemap
Open Graph title, description, and image on every page
JSON-LD: WebApplication on the tool pages, FAQPage where FAQs exist
Internal links between all four pages via the related array
llms.txt at root
```

Pick one URL form and enforce it. Trailing slash, apex domain, https.
Verify GitHub Pages is not serving both `/hourly-planner` and
`/hourly-planner/` as separate live 200 responses.

---

## Testing checklist before launch

```
[ ] Prints correctly on A4
[ ] Prints correctly on Letter
[ ] Now line freezes on print with timestamp
[ ] Ten tasks enterable without touching the mouse
[ ] Long task text does not break grid alignment
[ ] Free-time rows appear and are clickable
[ ] Keyboard tab order runs in time order
[ ] Focus rings visible on all interactive elements
[ ] Renders a usable grid with JavaScript disabled
[ ] Mobile layout holds at 360px width
[ ] Lighthouse performance above 95
[ ] All four pages have distinct titles and descriptions
[ ] Canonical tags correct on all four
[ ] sitemap.xml lists exactly four URLs
[ ] No console errors
```

---

## What not to build

Resist these. Each one has been considered and rejected for V1.

```
Save and load schedules          needs storage, breaks the no-account promise
Drag to reorder tasks            typing is faster, and it breaks on mobile
Color coding or categories       adds a decision the user did not ask for
Templates or presets             the defaults per landing page are the presets
Dark mode                        this is a document that gets printed
Share links                      requires encoding state into URLs, V2 at best
Calendar export                  Google Calendar already owns that job
```

If any of these feels essential during the build, it belongs in a note for
V2, not in the V1 branch.
