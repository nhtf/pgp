import { unwrap } from "$lib/Alert";
import type { Invite } from "$lib/types";
import { get } from "$lib/Web";
import type { PageLoad } from "./$types"

export const load: PageLoad = (async ({ fetch }) => {
    const invites: Invite[] = await unwrap(get("/user/me/invites"));

    console.log("Invites", invites);

    return { fetch, invites };
}) satisfies PageLoad;

