# PhishWatch

Public, searchable directory of confirmed phishing DApps and clone sites.  
Live site: https://anti-phishing-dapps.github.io/

- Client‑side only (static HTML, CSS, JS)
- Mobile‑first, accessible, multilingual (English, 繁體中文, 简体中文)
- Consumes a compact `data.json` schema for minimal size
- Zero build step; suitable for GitHub Pages

## Phishing DApp

AAVE, ApeBond, BabySwap, Cian, Citi, Fuse, Gno, HUMA, JamFi, Rocket Pool, Smardex, Spark, Stable, SuperLend, Sushi, Synthetix, Turtle, Urbned, Vnx

## Contents

- `index.html` — the app (search, tag filter, A–Z, i18n)
- `data.json` — blocklist data (compact)
- `favicon.ico` — site icon
- `robots.txt`, `sitemap.xml` — optional SEO files

## Getting started

- Local preview: open `index.html` in a modern browser or serve with a static server.
  - Example: `npx serve .` or `python3 -m http.server 8080`
- Data lives in `data.json`. Edit and commit; the app fetches it at runtime with `cache: no-store`.

## Data schema (compact)

The app supports a compact shape to reduce file size. Keys are short and optional fields have safe defaults.

Top-level:

```json
{
  "meta": {
    "name": "PhishWatch",
    "description": "Public, searchable directory of confirmed phishing DApps and clone sites. Blocklist of Malicious Web3 Domains.",
    "version": "1.0.0",
    "generatedAt": "2025-12-06"
  },
  "domains": [
    { "b": "fusehe.com", "t": ["phishing", "dapp"], "s": "2025-12-06" }
  ]
}