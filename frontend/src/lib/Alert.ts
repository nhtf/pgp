import { error } from "@sveltejs/kit";
import Swal from "sweetalert2";

export async function unwrap<T>(promise: Promise<T>): Promise<T> {
	try {
		return await promise;
	} catch (err: any) {
		Swal.fire({
			icon: "error",
			text: `${err.message}`,
		});

		throw error(err.status, err.message);
	}
}
