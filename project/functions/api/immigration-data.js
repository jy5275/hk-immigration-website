import { generateMockImmigrationData } from './mock.js';

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

function encodeControlPoint(name) {
  if (name in controlPointMap) {
    return controlPointMap[name];
  } else {
    return -1;
  }
}
  
function encodeDirection(dir) {
	return dir === "Arrival" ? 0 : 1;
}

export async function onRequest(context) {  
  let data = [];

  if (context.env.ENVIRONMENT === "development") {
    data = generateMockImmigrationData(100);
	} else {
    const ps = context.env.hk_immi_db.prepare(`
      SELECT id, date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total FROM immigration`);
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
  }

	return new Response(JSON.stringify(data), {
	  headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
	  }});
}
  