const controlPointMap = {
	"Lo Wu":                          0,
	"Lok Ma Chau Spur Line":          1,
  "Airport":                        2,
	"Shenzhen Bay":                   3,
	"Hong Kong-Zhuhai-Macao Bridge":  4,
  "Express Rail Link West Kowloon": 5,
  "Heung Yuen Wai":                 6,
  "Lok Ma Chau":                    7,
  "Macau Ferry Terminal":           8,
  "Man Kam To":                     9,
  "China Ferry Terminal":           10,
  "Kai Tak Cruise Terminal":        11,
  "Harbour Control":                12,
  "Sha Tau Kok":                    13,
  "Hung Hom":                       14,
  "Tuen Mun Ferry Terminal":        15,
};

export async function onRequest(context) {  
  if (context.env.ENVIRONMENT === "development") {
	  const mockData = [
		{ id: 1, date: '2025-04-27', arrivals: 1000, departures: 900 },
		{ id: 2, date: '2025-04-28', arrivals: 1100, departures: 950 },
	  ];
	  return Response.json({ results: mockData });
	}
  
	const ps = context.env.hk_immi_db.prepare(`
	  SELECT id, date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total FROM immigration`);
  
	let data = [];
  
	try {
	  const result = await ps.all();
	  for (const row of result.results) {
		data.push({
		  id: row.id,
		  date: row.date,
		  control_point_id: encodeControlPoint(row.control_point),
		  direction_id: encodeDirection(row.direction),
		  hk_residents: row.hk_residents,
		  mainland_visitors: row.mainland_visitors,
		  other_visitors: row.other_visitors,
		  total: row.total,
		});
	  }
	} catch (err) {
	  return new Response("D1 query failed: " + err.toString(), { status: 500 });
	}
  
	return new Response(JSON.stringify(data), {
	  headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
	  }});
}
  
function encodeControlPoint(name) {
	return controlPointMap[name] || -1;
}
  
function encodeDirection(dir) {
	return dir === "Arrival" ? 0 : 1;
}
  