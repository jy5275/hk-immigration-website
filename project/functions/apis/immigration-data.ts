interface Env {
	hk_immi_db: D1Database;
  }
  
  export const onRequest: PagesFunction<Env> = async (context) => {
	// Create a prepared statement with our query
	const ps = context.env.hk_immi_db.prepare("SELECT * from immigration limit 10");
	const data = await ps.first();
  
	return Response.json(data);
};