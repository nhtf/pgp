import Swal from "sweetalert2";

export async function unwrap<T>(promise: Promise<T>): Promise<T> {
	try {
		return await promise;
	} catch (e) {
		Swal.fire({
			icon: "error",
			text: `${e}`,
		});

		throw e;
	}
}
