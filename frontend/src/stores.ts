export const FRONTEND_ADDRESS = "localhost:5173";
export const BACKEND_ADDRESS = "localhost:3000";
export const FRONTEND = "http://" + FRONTEND_ADDRESS;
export const BACKEND = "http://" + BACKEND_ADDRESS;

export const doFetch = async (fetch: any, url: string, params?: any, query?: any): Promise<any> => {
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

	let final_params = params;

	if (!params) {
		final_params = { credentials: "include" };
	} else if (!params.credentials) {
		final_params.credentials = "include";
	}

	return await fetch(BACKEND + url, final_params);
}

export type User = {
	user_id: number,
	username: string,
	avatar: string
};

export type Message = {
	content: string,
	user: User,
};

export type Room = {
    id: number,
    name: string,
    owner: User,
    admins: User[],
    members: User[],
    invites: Invite[],
    messages: Message[],
}

export type Invite = {
	id: number,
	data: Date,
	from: User,
	to: User,
	room: Room,
}