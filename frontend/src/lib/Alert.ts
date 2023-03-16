import { goto } from "$app/navigation";
import { error } from "@sveltejs/kit";
import Swal from "sweetalert2";

const UNAUTHORIZED = 401;

export async function unwrap<T>(promise: Promise<T>): Promise<T> {
	try {
		return await promise;
	} catch (err: any) {
		if (err.status === UNAUTHORIZED) {
			await goto("/account_setup");
		
			return promise;
		}
	
		swal().fire({
			icon: "error",
			text: `${err.message}`,
		});

		throw error(err.status, err.message);
	}
}

export function swal(): typeof Swal {
	return Swal.mixin({
		color: "var(--text-color)",
		background: "var(--box-color)",
		confirmButtonColor: "var(--confirm-color)",
		cancelButtonColor: "var(--cancel-color)",
	});
}

export function succes() {
	swal().fire({ icon: "success", timer: 3000 });
}