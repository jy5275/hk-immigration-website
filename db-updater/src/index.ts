/**
 * Scheduled Worker that downloads the latest daily passenger-traffic CSV from
 * the Hong Kong Immigration Department and upserts the most recent rows into D1.
 */

const CSV_URL =
  'https://www.immd.gov.hk/opendata/eng/transport/immigration_clearance/statistics_on_daily_passenger_traffic.csv';

// CSV columns: Date, Control Point, Arrival / Departure, Hong Kong Residents,
// Mainland Visitors, Other Visitors, Total
const CSV_COLUMN_COUNT = 7;

// Only backfill a bounded number of recent rows per run. Each day adds roughly
// (control points) x (2 directions) records, so 630 rows cover a few weeks of
// catch-up after a missed run while staying well under D1's limits.
const MAX_ROWS_PER_RUN = 630;

type ImmigrationRow = [string, string, string, number, number, number, number];

interface DbRow {
  id: number;
  date: string;
  control_point: string;
  direction: string;
  hk_residents: number;
  mainland_visitors: number;
  other_visitors: number;
  total: number;
}

// "09-07-2025" -> "2025-07-09"
function parseDate(ddMmYyyy: string): string {
  const [day, month, year] = ddMmYyyy.split('-');
  return `${year}-${month}-${day}`;
}

function parseNumber(value: string): number {
  const parsed = Number.parseInt(value.replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseLine(line: string): ImmigrationRow | null {
  const fields = line.split(',');
  if (fields.length < CSV_COLUMN_COUNT) {
    console.warn(`Skipping malformed CSV row: ${line}`);
    return null;
  }

  const controlPoint =
    fields[1] === 'Macau Ferry Terminal' ? 'Macao Ferry Terminal' : fields[1];

  return [
    parseDate(fields[0]),
    controlPoint,
    fields[2],
    parseNumber(fields[3]),
    parseNumber(fields[4]),
    parseNumber(fields[5]),
    parseNumber(fields[6]),
  ];
}

export default {
  async fetch(_request: Request, env: Env): Promise<Response> {
    const response = await fetch(CSV_URL);
    const csvText = response.ok ? await response.text() : '';
    const lines = csvText.split('\n');

    let recent: { results: DbRow[] };
    try {
      recent = await env.hk_immi_db
        .prepare(
          `SELECT id, date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total
           FROM immigration ORDER BY date DESC, control_point, direction LIMIT 100`
        )
        .all<DbRow>();
    } catch (err) {
      return new Response('D1 query failed: ' + err, { status: 500 });
    }

    return Response.json(
      {
        'immi_api_data.length': lines.length,
        'immi_api_data.last_line': lines[lines.length - 2] ?? '',
        db_recent_100_records: recent.results,
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  },

  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const response = await fetch(CSV_URL);
    if (!response.ok) {
      console.error(`Failed to download CSV: ${response.status}`);
      return;
    }

    const csvText = await response.text();
    const lines = csvText.split('\n').slice(1); // drop header
    const recent = lines.slice(-MAX_ROWS_PER_RUN);

    const rows = recent
      .map((line) => parseLine(line.trim()))
      .filter((row): row is ImmigrationRow => row !== null);

    // D1 allows at most 100 bound parameters per statement, so 13 rows x 7
    // columns = 91 parameters is safely below the limit.
    const batchSize = 13;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const sql = `INSERT OR IGNORE INTO immigration
        (date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total)
        VALUES ${placeholders}`;
      try {
        await env.hk_immi_db.prepare(sql).bind(...batch.flat()).run();
      } catch (err) {
        console.error(`Failed to insert batch starting at row ${i}:`, err);
      }
    }

    console.log(`Update DB OK: processed ${rows.length} rows`);
  },
} satisfies ExportedHandler<Env>;