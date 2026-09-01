const controlPointMap = {
  "Lo Wu":                          0,
  "Lok Ma Chau Spur Line":          1,
  "Airport":                        2,
  "Shenzhen Bay":                   3,
  "Hong Kong-Zhuhai-Macao Bridge":  4,
  "Express Rail Link West Kowloon": 5,
  "Heung Yuen Wai":                 6,
  "Lok Ma Chau":                    7,
  "Macao Ferry Terminal":           8,
  "Man Kam To":                     9,
  "China Ferry Terminal":           10,
  "Kai Tak Cruise Terminal":        11,
  "Harbour Control":                12,
  "Sha Tau Kok":                    13,
  "Hung Hom":                       14,
  "Tuen Mun Ferry Terminal":        15,
};

function encodeControlPoint(name) {
  return controlPointMap[name] ?? -1;
}

function encodeDirection(dir) {
  return dir === "Departure" ? 1 : 0;
}

export async function onRequest(context) {
  try {
    const result = await context.env.hk_immi_db
      .prepare(
        `SELECT id, date, control_point, direction, hk_residents, mainland_visitors, other_visitors, total
         FROM immigration`
      )
      .all();

    const data = result.results
      .map((row) => ({
        id: row.id,
        date: row.date,
        control_point_id: encodeControlPoint(row.control_point),
        direction_id: encodeDirection(row.direction),
        hk_residents: row.hk_residents,
        mainland_visitors: row.mainland_visitors,
        other_visitors: row.other_visitors,
        total: row.total,
      }))
      .filter((row) => row.control_point_id !== -1);

    return Response.json(data, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(null, { status: 500, statusText: "D1 query failed: " + err });
  }
}