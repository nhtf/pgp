import type { LayoutLoad } from "./$types";
import  { error } from '@sveltejs/kit';

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

    let auth_req = 0;

    if (res.ok) {
        const response = await fetch('http://localhost:3000/account/auth_req', {
                credentials: 'include'
        });

        if (!response.ok)
                throw error(response.status, response.message);

        auth_req = await response.json();
    }

    return {
		username: item.username,
		avatar: item.avatar,
		user_id: item.user_id,
                auth_req: auth_req
	};
}) satisfies LayoutLoad;
