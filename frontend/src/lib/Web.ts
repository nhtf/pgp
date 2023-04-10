import { BACKEND, BOUNCER } from "./constants";

export async function json(
	input: RequestInfo | URL,
	info?: RequestInit | undefined,
): Promise<any> {
	const response = await window.fetch(input, info);
	const status = response.status;
	const data = await response.text();
	const parsed = (data ? JSON.parse(data) : {});

	if (!response.ok) {
		throw { status, message: parsed.message };
	} else {
		return parsed;
	}
}

export async function get(pathname: string, query?: any) {
	return await json(`${BACKEND}${pathname}${query ? `?${new URLSearchParams(query)}` : ''}`, {
		credentials: "include",
	});
}

export async function post(pathname: string, body?: any) {
	return await json(`${BACKEND}${pathname}`, {
		credentials: "include",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});
}

export async function patch(pathname: string, body?: any) {
	return await json(`${BACKEND}${pathname}`, {
		credentials: "include",
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});
}

export async function put(pathname: string, body?: any, raw?: boolean) {
	return await json(`${BACKEND}${pathname}`, {
		credentials: "include",
		method: "PUT",
		headers: raw ? {} : {
			"Content-Type": "application/json" ,
		},
		body: body ? (raw ? body : JSON.stringify(body)) : undefined,
	});
}

export async function remove(pathname: string, body?: any) {
	return await json(`${BACKEND}${pathname}`, {
		credentials: "include",
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

export async function bounceEmbed(digest: string, url: string) {
	return await json(`${BOUNCER}/${digest}/embed?${new URLSearchParams({ url })}`);
}
