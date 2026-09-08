# netgig.online — GSC Indexing Audit

**Date:** 2026-09-07
**Site age at time of audit:** 15 days (all pages first built/deployed 2026-08-23)
**Method:** Static build output read directly (`docs/`), cross-checked against the live site over HTTPS (curl, headers, rendered HTML, robots.txt, sitemap.xml).

---

## Summary of what's broken

**Nothing is technically broken today.** Canonical tags, the sitemap, robots.txt, redirects, and the `/hourly-planner/` page's content/schema are all correctly configured in the current build and confirmed live. The three GSC issues have two different explanations, neither of which is "fix the code":

1. **"Duplicate without user-selected canonical"** and **2. "Page with redirect"** (both on `http://www.netgig.online/`) — these are almost certainly **stale GSC classifications from the site's migration**, not a live problem. Git history shows the site was rebuilt from scratch on 2026-08-23: an old root-level `index.html` was deleted and replaced by the current `docs/`-based build + GitHub Pages workflow (commits `5bdee4a` → `7cc72f7`, all same day). Every current live variant of the URL (`http://www.netgig.online/`, `https://www.netgig.online/`, `http://netgig.online/`) correctly single-hop 301s to `https://netgig.online/`, and every page's canonical tag self-references the `https://` non-www URL consistently. GSC's Page Indexing report lags real crawl state, often by weeks — these two entries are very likely leftovers from before the current redirect/canonical setup existed, or from Google's very first crawl during the migration window.

3. **"Crawled - currently not indexed"** on `/hourly-planner/` — this is **not a content or technical defect**. The page has ~5,600 words of visible static text (a ~5,270-word article, not JS-injected), a proper H1, unique title/meta description, a self-referencing canonical, and both `WebApplication` and `FAQPage` JSON-LD schema — all present in the raw HTML the crawler sees. The far more likely cause is simply that **the site is 15 days old with no established authority/backlinks yet**. "Crawled – currently not indexed" is the default holding state Google uses for new, unproven domains while it decides whether the page is worth adding to the index — it commonly takes weeks to months to resolve on its own, especially with zero external links pointing at the domain. 20 impressions with no indexing is consistent with early, thin crawl-demand signals rather than a quality problem.

The one real (if minor) latent risk: the other three tool pages (`/hourly-schedule-template/`, `/daily-hourly-schedule/`, `/hour-by-hour-schedule/`) are near-duplicates of each other in structure and copy (330–350 words each, same UI chrome, same layout, no unique article) — they don't have the same defense `/hourly-planner/` has. If indexing issues persist, those three are the more likely long-term "Crawled — currently not indexed" or duplicate-content candidates, not `/hourly-planner/`.

---

## Detailed findings

### Site structure

Static build pipeline (`build.py`) reads `pages-config.json` + `template.html`/`template_index.html` and generates everything into `docs/`, which is what GitHub Actions (`.github/workflows/build.yml`) deploys to the `gh-pages` branch via `peaceiris/actions-gh-pages`.

**5 HTML pages, all under the `docs/` output root:**

| Output file | URL |
|---|---|
| `docs/index.html` | `https://netgig.online/` |
| `docs/hourly-planner/index.html` | `https://netgig.online/hourly-planner/` |
| `docs/hourly-schedule-template/index.html` | `https://netgig.online/hourly-schedule-template/` |
| `docs/daily-hourly-schedule/index.html` | `https://netgig.online/daily-hourly-schedule/` |
| `docs/hour-by-hour-schedule/index.html` | `https://netgig.online/hour-by-hour-schedule/` |

Directory tree (relevant parts):
```
netgig.online/
├── build.py
├── pages-config.json
├── template.html
├── template_index.html
├── article-hourly-planner.html
├── src/
│   ├── style.css
│   └── planner.js
├── assets/
│   ├── hero-desk.webp
│   ├── og-image-1200x630.{svg,webp}
│   └── favicon/...
└── docs/                          ← build output, deployed to gh-pages
    ├── index.html
    ├── sitemap.xml
    ├── robots.txt
    ├── llms.txt
    ├── src/                       (copied from src/)
    ├── assets/                    (copied from assets/)
    ├── hourly-planner/index.html
    ├── hourly-schedule-template/index.html
    ├── daily-hourly-schedule/index.html
    └── hour-by-hour-schedule/index.html
```

No `CNAME` file exists in the repo (root or `docs/`). The custom domain must be configured directly in the GitHub repo's Pages settings, and `peaceiris/actions-gh-pages` preserves whatever `CNAME` already exists on the `gh-pages` branch across deploys since the workflow doesn't pass a `cname:` input. This wasn't directly verifiable from the `main` branch, but live behavior (below) confirms it's working correctly today.

### Canonical tags

**All 5 pages have a self-referencing `<link rel="canonical">` in `<head>`.** None are missing. Confirmed in both the local build output and live via curl.

Sample tags:
- Homepage: `<link rel="canonical" href="https://netgig.online/">`
- `/hourly-planner/`: `<link rel="canonical" href="https://netgig.online/hourly-planner/">`
- `/hourly-schedule-template/`: `<link rel="canonical" href="https://netgig.online/hourly-schedule-template/">`

All use the `https://` + non-www + trailing-slash form consistently — matching the sitemap and the `base_url` in `pages-config.json` (`"https://netgig.online"`).

### Sitemap

`docs/sitemap.xml` exists (auto-generated by `build.py`) and is live at `https://netgig.online/sitemap.xml`. Contents:

| URL | priority |
|---|---|
| `https://netgig.online/` | 0.9 |
| `https://netgig.online/hourly-planner/` | 1.0 |
| `https://netgig.online/hourly-schedule-template/` | 0.8 |
| `https://netgig.online/daily-hourly-schedule/` | 0.8 |
| `https://netgig.online/hour-by-hour-schedule/` | 0.8 |

- `/hourly-planner/` **is present**, with the highest priority (1.0) of any page besides being listed.
- All URLs consistently use `https://` and the non-www apex domain — no mixed signals.
- `lastmod` is hardcoded to `2026-08-23` for every URL (a constant in `build.py`, not derived from actual file mtimes) — cosmetically odd but not a GSC error condition.
- Sitemap **is** referenced in `robots.txt`.

### robots.txt

Full contents (identical locally and live):
```
User-agent: *
Allow: /
Sitemap: https://netgig.online/sitemap.xml
```

Nothing is blocked. This is about as permissive as robots.txt gets — not a contributing factor to any of the three issues.

### Internal linking

`/hourly-planner/` receives internal links from every other page on the site:

- Homepage (`docs/index.html`): 1 link (tool card)
- `/hourly-schedule-template/`: 3 links (persistent sidebar nav, mobile nav, "Related Tools" list)
- `/daily-hourly-schedule/`: 3 links (same three spots)
- `/hour-by-hour-schedule/`: 3 links (same three spots)

**Total: 10 incoming internal links.** This is strong, not a contributing cause of the indexing issue.

No orphan pages — every page is reachable: the homepage is linked from all 3 non-planner tool pages via the "← All tools" link, and the 3 non-planner pages are linked from the homepage's tool cards and from `/hourly-planner/`'s "Related Tools" section.

One structural quirk worth flagging (not a GSC-reported issue): the sidebar/mobile nav link to `/hourly-planner/` carries a hardcoded `class="is-active"` on **every page**, including the 3 pages that aren't `/hourly-planner/`. It's a minor UX/accessibility nit (wrong page shows as "active" in nav), not an indexing problem.

### Content depth on `/hourly-planner/`

- **Total visible text word count: ~5,592 words** (full rendered page, including UI chrome); the article body alone is **~5,268 words**.
- **Content is 100% static HTML**, not JS-injected. The article (`article-hourly-planner.html`) is spliced directly into the page at build time by `build.py`'s `{{ARTICLE_CONTENT}}` replacement — a crawler fetching the raw HTML sees the full article with no JavaScript execution required. (The interactive planner *tool* itself is JS-enhanced, but it also ships a static, no-JS fallback timeline via `{{STATIC_GUTTER}}`/`{{STATIC_TRACK}}` — specifically built so crawlers see timeline content without JS, per the code comment in `build.py`.)
- **H1:** present — `<h1 class="display">PLANNED<br>YOUR WAY.</h1>` in the hero, plus a second `<h1 class="display">Hourly Planner</h1>` in the print-only header block. (Two `<h1>` elements on one page — not a hard error for Google, but worth knowing.)
- **Meta description:** present — "Free hourly planner generator. No login. No ads. Just plan and print."
- **FAQ section:** present — 13 Q&A pairs under "Frequently Asked Questions About Hourly Planners."
- **Schema markup:** present — a JSON-LD array with both `WebApplication` and `FAQPage` types (the `FAQPage` schema pulls its first 3 Q&A pairs from the article via `build_faq_jsonld()` in `build.py`).

First 30 lines of `<head>` (identical local vs. live):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Hourly Planner - Create an Hour-by-Hour Schedule</title>
  <meta name="description" content="Free hourly planner generator. No login. No ads. Just plan and print.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://netgig.online/hourly-planner/">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon/favicon-16x16.png">
  <link rel="apple-touch-icon" href="/assets/favicon/apple-touch-icon-180x180.png">

  <!-- Open Graph -->
  <meta property="og:title" content="Free Hourly Planner - Create an Hour-by-Hour Schedule">
  <meta property="og:description" content="Free hourly planner generator. No login. No ads. Just plan and print.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://netgig.online/hourly-planner/">
  <meta property="og:image" content="https://netgig.online/assets/og-image-1200x630.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/webp">
  <meta property="og:image" content="https://netgig.online/assets/og-image-1200x630.svg">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@500;600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

**Conclusion for this page specifically: content depth, schema, and crawlability are all in good shape. This is not a content problem.**

### Meta and schema (all pages)

| Page | Title | Description | Unique? |
|---|---|---|---|
| `/` | "netgig.online – Free Productivity Tools" | "Free online productivity tools. No accounts, no downloads..." | ✅ |
| `/hourly-planner/` | "Free Hourly Planner - Create an Hour-by-Hour Schedule" | "Free hourly planner generator. No login. No ads..." | ✅ |
| `/hourly-schedule-template/` | "Hourly Schedule Template - Free, Editable, Printable" | "Fill in an hourly schedule template online and print..." | ✅ |
| `/daily-hourly-schedule/` | "Daily Hourly Schedule Maker - Free Printable Planner" | "Plan your full day hour by hour, from morning to night..." | ✅ |
| `/hour-by-hour-schedule/` | "Hour by Hour Schedule Planner - Free and Printable" | "Break your day into hourly blocks and print the result..." | ✅ |

**No duplicate or missing titles/descriptions across any page.**

Structured data present:
- `WebApplication` JSON-LD on all 4 tool pages (not the homepage).
- `FAQPage` JSON-LD only on `/hourly-planner/` (the only page with `"show_article": true` in `pages-config.json`).
- Homepage has no JSON-LD at all — a missed opportunity (e.g. `WebSite`/`Organization`) but not a GSC error.

### Build pipeline

- **Canonical tags: already auto-injected.** `generate_page()` in `build.py` computes `canonical = f"{base_url}/{page['slug']}/"` and replaces `{{CANONICAL_URL}}` in the template for every page (`build.py:163-175`). This is 100% automated — nothing to add here.
- **Sitemap: already auto-generated.** `generate_sitemap()` (`build.py:214-237`) builds `docs/sitemap.xml` from `pages-config.json` on every build, called from `main()` (`build.py:294-296`).
- **robots.txt: already auto-generated** too (`generate_robots()`, `build.py:240-246`).

**There is no pipeline gap for canonical tags or sitemap generation** — both are already correctly wired into `build.py` and match the live site. If a real fix is ever needed here, the only pipeline-level items worth considering are cosmetic: making `SITEMAP_LASTMOD` (`build.py:211`) derive from actual content changes instead of a hardcoded date, and adding a homepage `WebSite`/`Organization` JSON-LD block to `generate_index()`.

---

## Prioritized fix list

Ranked by likely impact on the three reported GSC issues, most impactful first.

1. **Request re-indexing / re-validation in GSC, don't change code.** For all three issues, the underlying technical state is already correct (confirmed live). The fastest real fix is: in Search Console, use URL Inspection → "Request Indexing" on `https://netgig.online/hourly-planner/`, and use "Validate Fix" (or just let the next crawl cycle run) on the two `http://www.netgig.online/` issues now that the redirect/canonical are confirmed correct. **Type: one-time manual action in GSC (not a code/file change).**

2. **Build external signals for `/hourly-planner/`.** A 15-day-old domain with no backlinks is the single most likely reason a well-built, content-rich page sits in "Crawled – currently not indexed." Getting even a handful of external links (directories, Reddit/forum mentions, a Product Hunt-style listing, etc.) pointing at `/hourly-planner/` will do more than any on-page change. **Type: one-time manual action, outside the codebase.**

3. **Differentiate the 3 thin sibling pages before they hit the same issue.** `/hourly-schedule-template/`, `/daily-hourly-schedule/`, and `/hour-by-hour-schedule/` are 330–350 words each with near-identical structure/copy to each other. They currently ride on `/hourly-planner/`'s strength via internal links, but each is a candidate for the same "crawled, not indexed" fate once Google evaluates them independently. Consider giving each its own unique explanatory section (even 300–500 words) the way `/hourly-planner/` has its full article. **Type: one-time manual content edit** (content, not `build.py` — could optionally be templated as a second `{{ARTICLE_CONTENT}}`-style slot per page in `pages-config.json`/`build.py` if you want it repeatable, but the content itself must be written by hand, not generated).

4. **(Optional, low priority) Fix the hardcoded `is-active` class in the nav.** In `template.html`, the sidebar/mobile nav link to `/hourly-planner/` always renders `class="is-active"` regardless of which page is current. Not a GSC issue, but worth cleaning up since it's user- and crawler-visible on every page. **Type: `build.py`/`template.html` pipeline change** — would need the "active" class to be computed per-page instead of hardcoded in the shared template.

5. **(Optional, low priority) Add homepage structured data.** The homepage is the only page with zero JSON-LD. Adding a `WebSite` (and optionally `Organization`) schema block is a minor authority/rich-result signal, unrelated to the three reported issues. **Type: `build.py` pipeline change** — add a `generate_index()` JSON-LD block similar to `build_webapp_jsonld()`.

**Not recommended:** don't touch canonical tags, sitemap generation, or robots.txt — all three are already correct, automated, and verified live. Changing them now would be solving a problem that doesn't exist.
