import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";

export async function load({ params }: any) {
	const room = await unwrap(get(`/game/id/${params.id}`));
	const user = await unwrap(get("/user/me"));

	return { params, room, user };
};
