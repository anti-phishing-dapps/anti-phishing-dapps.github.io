# PhishWatch

Public, searchable directory of confirmed phishing DApps and clone sites.  
Live site: https://anti-phishing-dapps.github.io/

- Client-side static site (HTML, CSS, JS) — no runtime build step
- Mobile-first, accessible, multilingual (English, 繁體中文, 简体中文)
- SEO: per-domain static pages, sitemap, JSON-LD, crawlable domain index
- Consumes `phishing_data.json` (compact blocklist schema)

## Layout

```text
phish_watch/
  index.html              # Main directory + search/filter
  css/site.css
  js/i18n.js              # Translations
  js/app.js               # App logic
  js/domain-page.js       # Copy button on domain pages
  phishing_data.json      # Blocklist data
  d/*.html                # Generated per-domain SEO pages (--publish)
  sitemap.xml             # Regenerated on --publish
  robots.txt
```

## Local preview

From the grabfuse folder:

```bash
cd datacode/grabfuse
python start_phishwatch.py
```

Or manually:

```bash
cd website/phish_watch
python -m http.server 8080
```

Open http://127.0.0.1:8080/ — **do not open `index.html` directly** (`file://` blocks JSON fetch).

Hard-refresh after updates: `Ctrl+F5` (or clear cache) so the browser loads the latest `js/app.js`.

## Publish workflow (from grabfuse)

```bash
cd datacode/grabfuse
python grabfuse.py --update-json --date YYYYMMDD
python grabfuse.py --publish
```

`--publish` copies `grabfuse/phishing_data.json` to this folder and generates:

- `phishing_data.json`
- `d/{domain}.html` — one SEO page per domain (title, meta, JSON-LD; no links to live scam URLs)
- `sitemap.xml` — home + all domain pages
- Crawlable `<noscript>` domain index in `index.html`

Deploy to GitHub (`anti-phishing-dapps.github.io`) manually when ready. The site uses `phishing_data.json` only.

## Data schema

| Field | Meaning |
|-------|---------|
| `b` | Bare domain (no `www.`) |
| `t` | Tags, e.g. `["phishing", "dapp"]` |
| `s` | Last probed date (`YYYY-MM-DD`) |
| `st` | Optional status: `active`, `paused`, or `dead` |

```json
{
  "meta": {
    "name": "PhishWatch",
    "generatedAt": "2026-07-11"
  },
  "domains": [
    { "b": "fuseeth.com", "t": ["phishing", "dapp"], "s": "2026-07-11", "st": "paused" }
  ]
}
```

## SEO notes

- Domain names appear in page titles, URLs (`/d/fuseeth.com.html`), sitemap, and static index links
- Cards link to local domain pages, not live scam sites
- Copy-domain button for safe sharing
