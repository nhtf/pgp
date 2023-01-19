import type { PageLoad } from "./$types"

export async function load({ params }: any) {
	return { params };
};
