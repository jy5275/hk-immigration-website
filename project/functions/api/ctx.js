export async function onRequest(context) {
	const ps = context.env;
	return Response.json(ps);
}  