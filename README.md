# Hong Kong Immigration Dashboard

Interactive dashboard showing daily Hong Kong immigration passenger traffic by
passenger category and control point, sourced from the
[Immigration Department](https://www.immd.gov.hk/hks/facts/passenger-statistics-menu.html).

- Live site: <https://hk-immigration.jiangyan.click/>

## Repo structure

- `project/` — React + Vite frontend, deployed as a Cloudflare Pages site. Reads
  D1 via the Pages Function `project/functions/api/immigration-data.js`.
- `db-updater/` — Cloudflare Worker (daily cron) that downloads the previous day's
  CSV from the Immigration Department and upserts it into the D1 database.
- `scripts/`, `plot/` — legacy/one-off scripts (old Go backend, CSV/SQLite dumps,
  matplotlib charts) not used by the deployed site.

## Run the frontend locally

```bash
cd project
npm install
npm run dev
```

Without a local D1 binding the app falls back to generated mock data, so it runs
out of the box.

For the development workflow (lint/typecheck/build), deployment details, and code
conventions, see [AGENTS.md](AGENTS.md).