# DTC Viewer

Simple React interface to browse Diagnostic Trouble Codes (DTC) for Saab vehicles.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Scraping data

A scraping script (`scripts/scrape.mjs`) can collect DTC data from z90.pl and output `public/dtc-index.json`.
Run it with:

```bash
node scripts/scrape.mjs
```

The script contains placeholder selectors and model/year lists that may need to be adjusted to match the source site.
