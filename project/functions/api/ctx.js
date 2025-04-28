export async function onRequest(context) {
	const ps = context;
	return Response.json(ps);
}  