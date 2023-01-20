import type { Invite, SerializedRoom } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	const room: SerializedRoom = await unwrap(get(fetch, `/room/${params.room}`));

    return { fetch, room };
}) satisfies PageLoad;

