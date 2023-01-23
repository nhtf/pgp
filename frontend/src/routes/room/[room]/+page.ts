import type { Room } from "$lib/types";
import { unwrap } from "$lib/Alert";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch, params }) => {
	const room: Room = await unwrap(get(fetch, `/room/${params.room}`));
    const invited: boolean = await unwrap(get(fetch, `/room/${room.id}/invited`));

    return { fetch, room, invited };
}) satisfies PageLoad;

