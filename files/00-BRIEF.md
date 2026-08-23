# Hourly Planner: Project Brief

Read this file first. Every other spec in this folder assumes the decisions here.

---

## What we are building

A free hourly planner generator at `netgig.online/hourly-planner/`

Static site. Vanilla HTML, CSS, JS. No framework. No build step beyond the
existing Python generator. GitHub Pages. No accounts, no backend, no database,
no external API calls.

The user opens the page, sets their hours, types their tasks, and prints a
daily schedule. That is the entire product.

---

## The one thing this product is

**The fastest path from an empty screen to a printed daily schedule.**

Every decision in every spec file follows from that sentence. When a
feature is proposed and it is unclear whether to include it, ask whether it
makes that path faster. If it does not, it does not ship in V1.

---

## Why this and not something else

The market for hourly schedule tools is served by four kinds of product,
and every one of them is slow:

Canva requires an account and drops the user into a design canvas.
Template.net funnels toward a paywall.
Smartsheet hands over an Excel file to download and open.
101Planners works but is built around decorative planner inserts.

None of them is a purpose-built generator that produces a printable
schedule in under sixty seconds. That gap is the entire thesis.

101Planners currently ranks with a small site, which is the evidence that a
small site can hold position in this SERP. That is the encouraging signal.

---

## Honest economics

This section exists so nobody is surprised in four months.

The validated keyword cluster totals roughly 6,610 US searches per month.
Ranking in the top three across that whole cluster produces somewhere near
2,000 monthly pageviews at maturity. At a planning RPM of $8, that is about
$16 per month from display advertising.

The tool does not pay for itself through its own traffic. It is a traffic
acquisition layer. Revenue, if it comes, comes from supporting content pages
that target higher-intent keywords where a software affiliate makes sense.

DeskTime is the strongest affiliate found so far: 30 percent commission for
nine months after a referred customer's first payment, 30-day cookie. Two
important constraints that are easy to miss: commission only starts after at
least two customers are referred, and payouts release at a $25 minimum.

Build accordingly. Do not add affiliate links into the planner workflow
itself. The tool stays clean.

---

## Kill criteria

Write these into the repo README at launch. Check them on schedule.

```
LAUNCH DATE: ___________

DAY 30
  Affiliate program identified paying $20+ per conversion?
  If NO, this is an ad-only site. An ad-only site needs 20,000+
  monthly pageviews to matter. Decide then whether to continue.

DAY 90
  Under 500 monthly impressions in Google Search Console? KILL.

DAY 120
  Under 2,000 monthly pageviews? KILL.
  Zero affiliate revenue? Reassess monetization.

DAY 150
  Under $30/month total revenue? KILL or park.
```

A killed project is not a failed one. It is a project that returned its
answer faster than expected.

---

## Scope

### V1 ships with

Core generator with start time, end time, and interval control
Quick-add row for entering tasks without buttons or modals
Auto-fit task cells that grow with content
Free-time detection between scheduled blocks
Print stylesheet targeting A4 and Letter
Four landing pages sharing one generator with different defaults

### V2 holds

Running-late mode that rebuilds the remaining day
Focus-now mode that collapses to current and next task
Student and workday variants, pending keyword validation

### Never

Accounts, login, or saved profiles
Backend or database
AI features
External API calls
Affiliate links inside the planner interface
Cookie banners beyond what analytics strictly requires

---

## Success looks like

A person lands from Google, understands the tool within three seconds,
enters four tasks, hits print, and gets a page worth putting on a desk.

They do not read instructions. They do not create an account. They do not
see a paywall.

If that happens reliably, everything else is a traffic problem, and traffic
problems are solvable.
