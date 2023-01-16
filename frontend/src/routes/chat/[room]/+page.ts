import { error, redirect } from "@sveltejs/kit";
import { get } from "svelte/store";
import { BACKEND } from "../../../stores";
import type { PageLoad } from "./$types"

// doFetch(data.fetch, "/info", { credentials: "include" }, { id: user.user_id })
async function doFetch(fetch: any, url: string, params: any, query?: any): Promise<Response> {
	if (query != undefined) {
		let i = 0;
		url += "?";
		for (const [key, value] of Object.entries(query)) {
			if (i > 0)
				url += "&";
			url += key + "=" + value;
			i++;
		}
	}
	console.log(url);

    return fetch(get(BACKEND) + url, params);
}

export const load = (async ({ fetch, params }: any) => {
	let url = "http://localhost:3000/account/whoami";
    let response = await fetch(url, {
		credentials: "include",
	});

	if (!response.ok) {
		throw redirect(307, "/profile"); // TODO
	}

	const user = await response.json();

	url = "http://localhost:3000/chat/room";
    response = await fetch(url + "?id=" + params.room, {
		credentials: "include",
	});

	if (!response.ok) {
		throw error(response.status, (await response.json()).message);
	}

	const room = await response.json();

	console.log(room);

    return { fetch, user, room };
}) satisfies PageLoad

