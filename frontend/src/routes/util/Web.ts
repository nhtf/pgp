export const frontend = `localhost:5173`;
export const backend = `localhost:3000`;

export async function json(
	input: RequestInfo | URL,
	info?: RequestInit | undefined,
): Promise<any> {
	const response = await fetch(input, info);
	const data = await response.json();

	if (!response.ok) {
		throw data.message;
	} else {
		return data;
	}
}

export async function get(pathname: string) {
	return await json(`http://${backend}${pathname}`, {
		credentials: "include",
	});
}

export async function post(pathname: string, body: any) {
	return await json(`http://${backend}${pathname}`, {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}
