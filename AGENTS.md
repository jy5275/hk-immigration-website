# AGENTS.md

Guidance for AI agents and contributors. See [README.md](README.md) for the product
overview and how to run the site.

## Layout

Two Cloudflare apps share one D1 database (`hk_immi_db`):

- `project/` → Cloudflare **Pages**: React + Vite frontend, plus the
  `functions/api/immigration-data.js` API that reads D1.
- `db-updater/` → Cloudflare **Worker** (cron `0 2 * * *`): downloads the daily CSV
  from the Immigration Department and upserts it into D1.

`scripts/` and `plot/` are legacy/local and belong to no deployable.

## Data flow

1. `db-updater/src/index.ts` pulls
   `https://www.immd.gov.hk/opendata/eng/transport/immigration_clearance/statistics_on_daily_passenger_traffic.csv`
   (columns: date `DD-MM-YYYY`, control point, direction, 3 categories, total).
2. It normalizes dates to `YYYY-MM-DD`, renames `Macau Ferry Terminal` →
   `Macao Ferry Terminal`, and `INSERT OR IGNORE`s into the `immigration` table.
3. `project/functions/api/immigration-data.js` maps the `control_point`/`direction`
   strings to the numeric ids defined in `project/src/types/consts.tsx` and returns JSON.
4. `project/src/services/databaseService.ts` falls back to mock data when the API
   fails, so the UI still renders without a local D1 binding.

## Commands

There are no automated tests — verify with lint, typecheck, and build.

`project/`:

```bash
npm install
npm run lint                          # ESLint
npx tsc -p tsconfig.app.json --noEmit # typecheck
npm run build                         # vite build
```

`db-updater/`:

```bash
npm install
npx tsc --noEmit                            # typecheck
npx wrangler dev --test-scheduled           # needs `wrangler login` + D1 binding
```

## Deployment & codegen

- Worker: `npx wrangler deploy` (run in `db-updater/`).
- Pages: build output is `project/dist`, configured via `project/wrangler.toml`.
- After editing `db-updater/wrangler.jsonc`, regenerate `worker-configuration.d.ts`
  with `make gen-types` (or `npx wrangler types`).