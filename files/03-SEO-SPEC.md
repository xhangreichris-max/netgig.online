# Hourly Planner: SEO Spec

Page structure, keyword targets, and the content plan that actually carries
the monetization.

---

## Launch pages

Four pages. Every one shares the same generator with different defaults.

| Slug | Primary keyword | Volume | KD | Defaults |
|---|---|---|---|---|
| `/hourly-planner/` | hourly planner | 2,400 | 9 | 08:00 to 18:00, 30 min |
| `/hourly-schedule-template/` | hourly schedule template | 1,600 | 26 | 08:00 to 18:00, 60 min |
| `/daily-hourly-schedule/` | daily hourly schedule | 720 | 26 | 07:00 to 22:00, 60 min |
| `/hour-by-hour-schedule/` | hour by hour schedule | 390 | 22 | 06:00 to 22:00, 60 min |

Combined target: roughly 5,110 monthly searches.

`/hourly-planner/` is the entry page. It carries the lowest difficulty and
the highest volume, which is the combination that gets a new domain its
first rankings.

---

## Second wave, after the first pages hold position

Do not build these on day one. Build them when the first four show
impressions in Search Console.

| Slug | Primary keyword | Volume | KD | Note |
|---|---|---|---|---|
| `/24-hour-schedule/` | 24 hour schedule | 260 | 22 | High CPC at $4.30 |
| `/hourly-schedule/` | hourly schedule | 590 | 26 | CPC $2.43 |
| `/hourly-calendar-template/` | hourly calendar template | 260 | 33 | Hardest, do last |

---

## Pages that need validation before building

These came out of brainstorming without volume data attached. Run them
through Semrush and a live SERP check before committing a page to each.

```
hourly schedule generator
hourly schedule maker
daily schedule generator
daily schedule maker
free hourly planner
time block planner
student hourly planner
hourly work schedule
```

The generator and maker variants are the most promising because the intent
is unambiguously tool-shaped. Check them first.

Apply the same kill criteria used before: if Amazon, Etsy, Pinterest, or app
stores dominate the SERP, the intent is product or download, not tool. Skip
it regardless of how low the difficulty score looks.

---

## Meta content

Titles stay under 60 characters. Descriptions under 155.

```
/hourly-planner/
  title: Free Hourly Planner - Build and Print a Daily Schedule
  desc:  Make an hour-by-hour schedule in your browser and print it.
         No account, no download, no setup. Works on phone and desktop.

/hourly-schedule-template/
  title: Hourly Schedule Template - Free, Editable, Printable
  desc:  Fill in an hourly schedule template online and print it straight
         away. Set your own hours and intervals. No sign up needed.

/daily-hourly-schedule/
  title: Daily Hourly Schedule Maker - Free Printable Planner
  desc:  Plan your full day hour by hour, from morning to night. Print a
         clean daily schedule you can write on. Free, no account.

/hour-by-hour-schedule/
  title: Hour by Hour Schedule Planner - Free and Printable
  desc:  Break your day into hourly blocks and print the result. Built for
         time blocking. No download, no account, works in any browser.
```

Once these are live, freeze them for 90 days. Rewriting titles during the
initial indexing window makes it impossible to read what is working.

---

## On-page structure

Every landing page follows the same shape.

```
H1: the primary keyword, phrased naturally
    the tool, immediately, above the fold
    two or three sentences on what this page's variant is for
H2: How to use it
    four numbered steps, short
H2: Who this is for
    a short paragraph, specific to this variant
H2: Frequently asked questions
    three or four questions, marked up as FAQPage
    internal links to the other three pages
```

The tool comes before the prose. A visitor from Google should be able to use
it without scrolling. The text below exists for the crawler and for the
minority who read it.

Keep the prose per page genuinely different. Four pages with reworded copy
around the same generator is thin content, and Google treats it that way.
Each page should discuss its own use case with its own examples.

---

## Schema

```
All pages:        WebApplication
Pages with FAQ:   FAQPage
Site root:        WebSite with SearchAction omitted
```

Do not add HowTo schema. Google reduced its rich result support and it adds
maintenance cost for nothing.

---

## Internal linking

Four pages, each linking to the other three from a related tools block in
the footer of the content area. Use descriptive anchors, not "click here."

```
hourly-planner        → hourly-schedule-template, daily-hourly-schedule,
                        hour-by-hour-schedule
hourly-schedule-template → hourly-planner, daily-hourly-schedule
daily-hourly-schedule → hourly-planner, hour-by-hour-schedule
hour-by-hour-schedule → hourly-planner, daily-hourly-schedule
```

Site root at `netgig.online/` becomes a productivity tools index linking to
all four. It is the hub. Every tool page links back to it.

---

## The part that actually makes money

The tool pages will not monetize well. That was established in the brief.
Their job is to bring traffic and build topical authority for the domain.

Money comes from supporting content targeting keywords where a software
purchase is plausible. Build these only after the tool pages have impressions.

Directions worth researching when that point arrives:

```
time tracking software for freelancers
time blocking apps compared
how to plan your day as a freelancer
best scheduling software for small teams
timesheet templates for contractors
```

These carry real commercial intent and real CPC. DeskTime, ClickUp, and
similar products fit naturally into that content in a way they never fit
into a planner tool.

Validate each one before writing. The same kill criteria apply. Do not
assume commercial intent from CPC alone.

---

## Analytics setup

```
Google Search Console property, day one
Sitemap submitted, day one
Indexing requested on all four pages, day one
GA4 property with a custom event on print
```

The print event is the metric that matters. Pageviews tell you people
arrived. Print events tell you the tool worked.

Track: `plan_printed` with the variant slug as a parameter. If a page has
traffic but no print events, that page's defaults are wrong.

---

## Ninety day review

At day 90, pull Search Console and answer four questions.

```
Which of the four pages has the most impressions?
Which has the best CTR?
Which queries are showing up that we did not target?
Which pages have traffic but no print events?
```

The third question usually produces the next page to build. Queries you did
not plan for are the market telling you what it wants.
