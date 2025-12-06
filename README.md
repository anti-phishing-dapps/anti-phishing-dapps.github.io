# PhishWatch – Phishing DApp Directory

PhishWatch is a lightweight, multilingual, client‑side website that lists confirmed phishing DApps and clone sites. It loads a public data.json, lets you search, filter by tags, and view alphabet filters, and displays when the data was last updated.

Live site:
- https://anti-phishing-dapps.github.io/

## Features

- Client-side search over known malicious Web3 domains
- Tag filter and A–Z filter (by base domain)
- Multilingual UI: English, 繁體中文, 简体中文
- Accessibility-minded (keyboard and screen-reader friendly)
- “Data last updated” shown in the footer, derived from data.json

## Data source

The site fetches a JSON file at runtime:

- Path: data.json
- Shape:
  ```json
  {
    "meta": {
      "generatedAt": "2025-01-15T12:34:56Z"
    },
    "domains": [
      { "domain": "www.fuseeta.com", "base": "fuseeta.com", "tags": ["phishing","dapp"], "lastSeen": "2025-01-15" }
    ]
  }