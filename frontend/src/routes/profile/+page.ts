export const ssr = false;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }: any) {
	let userlog: string;
    const res = await fetch("http://localhost:3000/account/whoami", {
			method: "GET",
			credentials: "include",
			mode: "cors",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});
		const item = await res.json();
        userlog = item.username;
    return {userlog};
  }
