export async function onRequest(context) {
  if (context.env.ENVIRONMENT === "development") {
	  const mockData = [
		{ id: 1, date: '2025-04-27', arrivals: 1000, departures: 900 },
		{ id: 2, date: '2025-04-28', arrivals: 1100, departures: 950 },
	  ];
	  return Response.json({ results: mockData });
	}
  
	const ps = context.env.hk_immi_db.prepare("SELECT * from immigration limit 10");
	const data = await ps.all();
  
	return Response.json(data);
}  