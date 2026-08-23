#!/usr/bin/env python3
"""
build.py – Page generator for netgig.online

Reads pages-config.json and template.html, generates:
  - docs/[slug]/index.html for each page (with static grid rows)
  - docs/index.html from template_index.html
  - docs/sitemap.xml
  - docs/robots.txt
  - docs/llms.txt
"""

import json
import os
import textwrap

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, "docs")
CONFIG_PATH = os.path.join(ROOT, "pages-config.json")
TEMPLATE_PATH = os.path.join(ROOT, "template.html")
INDEX_TEMPLATE_PATH = os.path.join(ROOT, "template_index.html")


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_template(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def parse_time(time_str):
    """Convert 'HH:MM' to total minutes."""
    h, m = time_str.split(":")
    return int(h) * 60 + int(m)


def format_time(total_minutes):
    """Convert total minutes to 'HH:MM'."""
    h = (total_minutes // 60) % 24
    m = total_minutes % 60
    return f"{h:02d}:{m:02d}"


def generate_time_slots(start, end, interval):
    """Return list of time strings from start to end (inclusive) at interval."""
    start_min = parse_time(start)
    end_min = parse_time(end)
    slots = []
    t = start_min
    while t <= end_min:
        slots.append(format_time(t))
        t += interval
    return slots


def build_static_grid(slots):
    """Build static HTML grid rows for crawlers to see without JS."""
    rows = []
    for i, time in enumerate(slots):
        hint = ""
        if i == 0:
            hint = '\n        <span class="empty-hint">Start typing to add a task</span>'
        rows.append(
            f'    <div class="schedule-row">\n'
            f'      <div class="time-label">{time}</div>\n'
            f'      <div class="task-cell">{hint}\n'
            f'      </div>\n'
            f'    </div>'
        )
    return "\n\n".join(rows)


def build_jsonld(page, base_url):
    """Build JSON-LD WebApplication schema."""
    data = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": page["title"],
        "url": f"{base_url}/{page['slug']}/",
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    }
    return json.dumps(data, indent=4)


def build_related_links(current_slug, all_pages):
    """Build HTML list items linking to all other pages + home."""
    links = []
    for p in all_pages:
        if p["slug"] != current_slug:
            links.append(
                f'      <li><a href="../../{p["slug"]}/">{p["h1"]}</a></li>'
            )
    return "\n".join(links)


def build_select_defaults(template, page):
    """Set selected attributes on the start, end, interval dropdowns."""
    html = template

    # Start time: mark the matching option as selected
    start_val = page["start"]
    # Remove any existing selected on start-time options
    # Then add selected to the right one
    # We'll do this by processing the select blocks

    # For start-time select
    old_start = f'<option value="{start_val}">{start_val}</option>'
    new_start = f'<option value="{start_val}" selected>{start_val}</option>'
    # Only replace within the start-time context — but since values are unique
    # across the whole template for start options, this is safe
    html = html.replace(old_start, new_start, 1)

    # For end-time select
    end_val = page["end"]
    old_end = f'<option value="{end_val}">{end_val}</option>'
    new_end = f'<option value="{end_val}" selected>{end_val}</option>'
    # The end options come after start options; replace the LAST occurrence
    # Actually, if the value exists in both selects we need to be careful.
    # Since start select goes up to 12:00 and end select starts at 12:00,
    # some values overlap. Let's find the right one.
    # Strategy: split on the end-time select id and replace in the second part.
    parts = html.split('id="end-time"', 1)
    if len(parts) == 2:
        parts[1] = parts[1].replace(old_end, new_end, 1)
        html = 'id="end-time"'.join(parts)

    # For interval select
    interval_val = str(page["interval"])
    old_int = f'<option value="{interval_val}">{interval_val} min</option>'
    new_int = f'<option value="{interval_val}" selected>{interval_val} min</option>'
    parts = html.split('id="interval"', 1)
    if len(parts) == 2:
        parts[1] = parts[1].replace(old_int, new_int, 1)
        html = 'id="interval"'.join(parts)

    return html


def generate_page(page, template, all_pages, base_url):
    """Generate a single page HTML from template and page config."""
    canonical = f"{base_url}/{page['slug']}/"
    slots = generate_time_slots(page["start"], page["end"], page["interval"])
    static_grid = build_static_grid(slots)
    jsonld = build_jsonld(page, base_url)
    related = build_related_links(page["slug"], all_pages)

    html = template
    html = html.replace("{{TITLE}}", page["title"])
    html = html.replace("{{DESCRIPTION}}", page["description"])
    html = html.replace("{{CANONICAL_URL}}", canonical)
    html = html.replace("{{H1}}", page["h1"])
    html = html.replace("{{DATA_START}}", page["start"])
    html = html.replace("{{DATA_END}}", page["end"])
    html = html.replace("{{DATA_INTERVAL}}", str(page["interval"]))
    html = html.replace("{{STATIC_GRID}}", static_grid)
    html = html.replace("{{JSONLD}}", jsonld)
    html = html.replace("{{RELATED_LINKS}}", related)

    # Set correct selected attributes on dropdowns
    html = build_select_defaults(html, page)

    return html


def generate_index(index_template, all_pages):
    """Generate docs/index.html from template_index.html."""
    links = []
    for p in all_pages:
        links.append(
            f'    <li>\n'
            f'      <a href="{p["slug"]}/">\n'
            f'        <div class="tool-name">{p["h1"]}</div>\n'
            f'        <div class="tool-desc">{p["description"]}</div>\n'
            f'      </a>\n'
            f'    </li>'
        )
    tool_links = "\n".join(links)
    return index_template.replace("{{TOOL_LINKS}}", tool_links)


def generate_sitemap(pages, base_url):
    """Generate sitemap.xml listing all pages with trailing slash."""
    urls = []
    for p in pages:
        urls.append(
            f"  <url>\n"
            f"    <loc>{base_url}/{p['slug']}/</loc>\n"
            f"  </url>"
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )


def generate_robots(base_url):
    """Generate robots.txt."""
    return (
        "User-agent: *\n"
        "Allow: /\n"
        f"Sitemap: {base_url}/sitemap.xml\n"
    )


def generate_llms_txt():
    """Generate llms.txt."""
    return textwrap.dedent("""\
        # netgig.online
        Free productivity tools. No accounts. No downloads.

        ## Tools
        - /hourly-planner/ Free hourly planner generator
        - /hourly-schedule-template/ Hourly schedule template
        - /daily-hourly-schedule/ Daily hourly schedule maker
        - /hour-by-hour-schedule/ Hour by hour schedule planner
    """)


def write_file(path, content):
    """Write content to path, creating directories as needed."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  [ok] {os.path.relpath(path, ROOT)}")


def main():
    config = load_config()
    base_url = config["base_url"]
    pages = config["pages"]
    template = load_template(TEMPLATE_PATH)
    index_template = load_template(INDEX_TEMPLATE_PATH)

    print("Building pages...")

    # Generate tool pages
    for page in pages:
        html = generate_page(page, template, pages, base_url)
        out_path = os.path.join(DOCS, page["slug"], "index.html")
        write_file(out_path, html)

    # Generate index
    index_html = generate_index(index_template, pages)
    write_file(os.path.join(DOCS, "index.html"), index_html)

    # Generate sitemap
    sitemap = generate_sitemap(pages, base_url)
    write_file(os.path.join(DOCS, "sitemap.xml"), sitemap)

    # Generate robots.txt
    robots = generate_robots(base_url)
    write_file(os.path.join(DOCS, "robots.txt"), robots)

    # Generate llms.txt
    llms = generate_llms_txt()
    write_file(os.path.join(DOCS, "llms.txt"), llms)

    print(f"\nDone. {len(pages)} pages generated.")


if __name__ == "__main__":
    main()
