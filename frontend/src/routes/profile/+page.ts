//TODO this needs to be a +page.server.ts file!!!
import { error } from '@sveltejs/kit';

export const ssr = false;

interface ResultDTO {
	id: number;
	username: string;
}

export async function load({ fetch }) {
	const response = await fetch("http://localhost:3000/whoami", {
        method: "GET",
        credentials: "include",
        mode: "cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
	if (!response.ok)
		throw error(response.status, (await response.json()).message);
	const result: ResultDTO = await response.json();
	return {
		user_id: result.id,
		username: result.username
	};
}
