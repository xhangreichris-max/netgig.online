#!/usr/bin/env python3
"""
build.py – Page generator for netgig.online

Reads pages-config.json and template.html, generates:
  - docs/[slug]/index.html for each page (with static hourly timeline rows)
  - docs/index.html from template_index.html
  - docs/sitemap.xml
  - docs/robots.txt
  - docs/llms.txt
  - docs/src/    (copied from src/,    so style.css and planner.js are servable)
  - docs/assets/ (copied from assets/, if present, so hero/template images are servable)
"""

import json
import os
import re
import shutil
import textwrap

ROOT = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(ROOT, "docs")
SRC = os.path.join(ROOT, "src")
ASSETS = os.path.join(ROOT, "assets")
CONFIG_PATH = os.path.join(ROOT, "pages-config.json")
TEMPLATE_PATH = os.path.join(ROOT, "template.html")
INDEX_TEMPLATE_PATH = os.path.join(ROOT, "template_index.html")
ARTICLE_PATH = os.path.join(ROOT, "article-hourly-planner.html")


def copy_dir(src, dest, label):
    """Copy a source directory into docs/, replacing any previous copy."""
    if not os.path.isdir(src):
        print(f"  [skip] {label} (no {os.path.relpath(src, ROOT)}\\ folder found)")
        return
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    print(f"  [ok] {label}")


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


def format_time_12(total_minutes):
    """Convert total minutes (on the hour) to a 12-hour label, e.g. '6:00 AM'."""
    h = (total_minutes // 60) % 24
    period = "PM" if h >= 12 else "AM"
    h12 = h % 12
    if h12 == 0:
        h12 = 12
    return f"{h12}:00 {period}"


def generate_hour_marks(start, end):
    """Return a list of on-the-hour minute marks from start to end inclusive."""
    start_min = parse_time(start)
    end_min = parse_time(end)
    marks = []
    t = (start_min // 60) * 60
    if t < start_min:
        t += 60
    while t <= end_min:
        marks.append(t)
        t += 60
    return marks


def build_static_gutter(hour_marks):
    """Static hour labels so crawlers see timeline content without JS."""
    rows = [
        f'                <div class="gutter-row">{format_time_12(m)}</div>'
        for m in hour_marks
    ]
    return "\n".join(rows)


def build_static_track(hour_marks):
    """Static hour grid lines matching the gutter, no-JS fallback."""
    lines = ['                <div class="track-hour-line"></div>' for _ in hour_marks]
    return "\n".join(lines)


def build_webapp_jsonld(page, base_url):
    """Build JSON-LD WebApplication schema."""
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": page["tool_label"],
        "url": f"{base_url}/{page['slug']}/",
        "applicationCategory": "ProductivityApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    }


def build_faq_jsonld(article_path, count=3):
    """Build JSON-LD FAQPage schema from the first `count` H3/P pairs
    in the article file (the article's H3s are exclusively FAQ questions)."""
    with open(article_path, encoding="utf-8") as f:
        content = f.read()
    pairs = re.findall(r"<h3>(.*?)</h3>\s*<p>(.*?)</p>", content, re.DOTALL)

    def strip_tags(s):
        return re.sub(r"<[^>]+>", "", s).strip()

    entities = [
        {
            "@type": "Question",
            "name": strip_tags(question),
            "acceptedAnswer": {
                "@type": "Answer",
                "text": strip_tags(answer)
            }
        }
        for question, answer in pairs[:count]
    ]
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": entities
    }


def build_jsonld(page, base_url):
    """Build the page's JSON-LD block: WebApplication alone, or a
    [WebApplication, FAQPage] array on pages that show the FAQ article."""
    schemas = [build_webapp_jsonld(page, base_url)]
    if page.get("show_article") and os.path.isfile(ARTICLE_PATH):
        schemas.append(build_faq_jsonld(ARTICLE_PATH))
    data = schemas[0] if len(schemas) == 1 else schemas
    return json.dumps(data, indent=4)


def build_related_links(current_slug, all_pages):
    """Build HTML list items linking to all other tool pages."""
    links = []
    for p in all_pages:
        if p["slug"] != current_slug:
            links.append(
                f'          <li><a href="/{p["slug"]}/">{p["tool_label"]}</a></li>'
            )
    return "\n".join(links)


def generate_page(page, template, all_pages, base_url):
    """Generate a single page HTML from template and page config."""
    canonical = f"{base_url}/{page['slug']}/"
    hour_marks = generate_hour_marks(page["start"], page["end"])
    static_gutter = build_static_gutter(hour_marks)
    static_track = build_static_track(hour_marks)
    jsonld = build_jsonld(page, base_url)
    related = build_related_links(page["slug"], all_pages)

    html = template
    html = html.replace("{{TITLE}}", page["title"])
    html = html.replace("{{DESCRIPTION}}", page["description"])
    html = html.replace("{{CANONICAL_URL}}", canonical)
    html = html.replace("{{TOOL_LABEL}}", page["tool_label"])
    html = html.replace("{{HERO_LINE1}}", page["hero_line1"])
    html = html.replace("{{HERO_LINE2}}", page["hero_line2"])
    html = html.replace("{{DATA_START}}", page["start"])
    html = html.replace("{{DATA_END}}", page["end"])
    html = html.replace("{{DATA_INTERVAL}}", str(page["interval"]))
    html = html.replace("{{STATIC_GUTTER}}", static_gutter)
    html = html.replace("{{STATIC_TRACK}}", static_track)
    html = html.replace("{{JSONLD}}", jsonld)
    html = html.replace("{{RELATED_LINKS}}", related)

    if page.get("show_article"):
        article_html = open(ARTICLE_PATH, encoding="utf-8").read()
    else:
        article_html = ""
    html = html.replace("{{ARTICLE_CONTENT}}", article_html)

    return html


def generate_index(index_template, all_pages):
    """Generate docs/index.html from template_index.html."""
    links = []
    for p in all_pages:
        links.append(
            f'    <a class="tool-card" href="{p["slug"]}/">\n'
            f'      <div class="tool-name">{p["tool_label"]}</div>\n'
            f'      <p class="tool-desc">{p["description"]}</p>\n'
            f'      <span class="tool-link">Open tool &rarr;</span>\n'
            f'    </a>'
        )
    tool_links = "\n".join(links)
    return index_template.replace("{{TOOL_LINKS}}", tool_links)


SITEMAP_LASTMOD = "2026-08-23"


def generate_sitemap(pages, base_url):
    """Generate sitemap.xml: homepage + all tool pages, trailing slash,
    lastmod/changefreq/priority on every entry."""
    entries = [(f"{base_url}/", "0.9")]
    for p in pages:
        priority = "1.0" if p["slug"] == "hourly-planner" else "0.8"
        entries.append((f"{base_url}/{p['slug']}/", priority))

    urls = []
    for loc, priority in entries:
        urls.append(
            f"  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{SITEMAP_LASTMOD}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n"
            f"    <priority>{priority}</priority>\n"
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

    # Copy static assets (CSS, JS, images)
    copy_dir(SRC, os.path.join(DOCS, "src"), "docs\\src (from src\\)")
    copy_dir(ASSETS, os.path.join(DOCS, "assets"), "docs\\assets (from assets\\)")

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
