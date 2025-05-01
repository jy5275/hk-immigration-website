/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
 * - Run `npm run deploy` to publish your Worker
 *
 * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
export default {
	async fetch(req, env: Env) {
		let resp = await fetch('https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fwww.immd.gov.hk%2Fopendata%2Feng%2Ftransport%2Fimmigration_clearance%2Fstatistics_on_daily_passenger_traffic.csv');
		if (!resp.ok) {
			console.error(`Failed to download: ${resp.status}`);
			return new Response("hk immi department website API returns " + resp.status, { status: 500 });
		}

		const csvText = await resp.text();
		const lines = csvText.split("\n");
		let result: Record<string, any> | null;
		try {		
			result = await env.hk_immi_db.prepare(
				`SELECT id, date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total FROM immigration limit 1`
			).first();
		} catch (err) {
			return new Response("D1 query failed: " + err, { status: 500 });
	  	}
  
		const data = {
			"data.length": lines.length,
			"data.line[0]": lines[1],
			"db.firstline": result
		}
		return new Response(JSON.stringify(data), {
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": origin,
			}});
		},

	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		let resp = await fetch('https://res.data.gov.hk/api/get-download-file?name=https%3A%2F%2Fwww.immd.gov.hk%2Fopendata%2Feng%2Ftransport%2Fimmigration_clearance%2Fstatistics_on_daily_passenger_traffic.csv');
		if (!resp.ok) {
			console.error(`Failed to download: ${resp.status}`);
			return;
		}
		let lines: string[] = [];
	    try {
			const csvText = await resp.text();
			lines = csvText.split("\n").slice(1); // Skip line 1
			console.log("total length:", lines.length)
		} catch (err) {
			console.error("Process CSV file error: ", err);
		}

		let dataRows: any[] = [];
		for (let lineNumber = 2; lineNumber <= lines.length + 1; lineNumber++) {
			const line = lines[lineNumber - 2].trim();
			if (!line) continue;
			const record = line.split(",");
			if (record.length < 7) {
				console.warn(`${lineNumber} format error, ignore... ${record}`);
				continue;
			}
			const dateParts = record[0].split("-");
			const date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
			const control_point = record[1];
			const direction = record[2];
			const hk = parseInt(record[3].replace(/,/g, "")) || 0;
			const ml = parseInt(record[4].replace(/,/g, "")) || 0;
			const other = parseInt(record[5].replace(/,/g, "")) || 0;
			const total = parseInt(record[6].replace(/,/g, "")) || 0;
			dataRows.push([date, control_point, direction, hk, ml, other, total]);
		}

		const batchSize = 1000;
		for (let i = 0; i < dataRows.length; i += batchSize) {
			const batch = dataRows.slice(i, i + batchSize);
			const placeholders = batch.map(() => `(?, ?, ?, ?, ?, ?, ?)`).join(", ");
			const values = batch.flat();
			const sql = `INSERT OR IGNORE INTO immigration 
						(date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total)
						VALUES ${placeholders}`;
			try {
				await env.hk_immi_db.prepare(sql).bind(...values).run();
			} catch (e) {
				console.error(`Failed to insert ${i}: ${batch}`, e);
				continue;
			}
		}
		console.log("Update DB OK");
	},
} satisfies ExportedHandler<Env>;
