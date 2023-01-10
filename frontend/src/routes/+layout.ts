import type { LayoutLoad } from "./$types";

export const _default_profile_image = "https://www.w3schools.com/howto/img_avatar.png";

export const load = (async ({ fetch }: any) => {
    const res = await fetch("http://localhost:3000/account/whoami", {
			method: "GET",
			credentials: "include",
			mode: "cors",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
	const item = await res.json();

    return {
		username: item.username,
		avatar: item.avatar,
		user_id: item.user_id
	};
}) satisfies LayoutLoad;
