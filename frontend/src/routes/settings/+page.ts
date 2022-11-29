import { error } from '@sveltejs/kit';

export const ssr = false;

interface ResultDTO {
	id: number;
	username: string;
}

async function request(fetch_proc, path: string, method: string, body?: string): Promise<Response> {
	return await fetch_proc('http://localhost:3000' + path,
		{
			method: method,
			credentials: 'include',
			mode: 'cors',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		});
}

export async function load({ fetch, params }) {
	const response = await request(fetch, `/account/whoami`, 'GET');
	if (!response.ok)
		throw error(response.status, (await response.json()).message);
	const result: ResultDTO = await response.json();
	return {
		user_id: result.id,
		username: result.username
	};
}
