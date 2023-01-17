import { redirect } from "@sveltejs/kit";
import { doFetch } from "../../stores";
import type { PageLoad } from "./$types"

export const load = (async ({ fetch }: any) => {
    const response = await doFetch(fetch, "/room");

    if (!response.ok) {
        throw redirect(307, "/profile");
    }

    const rooms = await response.json();

    return { fetch, rooms };
}) satisfies PageLoad

