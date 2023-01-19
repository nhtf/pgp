import { is_empty } from "svelte/internal";
import { BACKEND } from "./constants";

export async function json(
	fetch: any,
	input: RequestInfo | URL,
	info?: RequestInit | undefined,
): Promise<any> {
	console.log(`${input}, ${JSON.stringify(info)}`);

	const response = await fetch(input, info);
	const status = response.status;
	const data = await response.json();

	if (!response.ok) {
		throw {	status,	message: `Backend: ${data.message}` };
	} else {
		return data;
	}
}

export async function get(fetch: any, pathname: string, query?: any) {
	return await json(fetch, `${BACKEND}${pathname}${query ? '?' + new URLSearchParams(query).toString() : ''}`, {
		credentials: "include",
	});
}

export async function post(fetch: any, pathname: string, body: any) {
	return await json(fetch, `${BACKEND}${pathname}`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

export async function remove(fetch: any, pathname: string) {
	return await json(fetch, `${BACKEND}${pathname}`, {
		method: "DELETE",
		credentials: "include",
	});
}
