import { BACKEND } from "./constants";

export async function json(
	input: RequestInfo | URL,
	info?: RequestInit | undefined,
): Promise<any> {

	const response = await window.fetch(input, info);
	const status = response.status;
	const data = await response.json();

	if (!response.ok) {
		throw {	status,	message: `Backend: ${data.message}` };
	} else {
		return data;
	}
}

export async function get(pathname: string, query?: any) {
	return await json(`${BACKEND}${pathname}${query ? '?' + new URLSearchParams(query).toString() : ''}`, {
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

export async function put(pathname: string, body: any, stringify: boolean) {
	if (stringify) {
		return await json(`${BACKEND}${pathname}`, {
			credentials: "include",
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
	}
	else {
		return await json(`${BACKEND}${pathname}`, {
			credentials: "include",
			method: "PUT",
			body: body,
		});
	}
	
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
