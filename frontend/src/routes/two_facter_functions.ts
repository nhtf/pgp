import { post } from "$lib/Web"
import Swal from "sweetalert2";
import "@sweetalert2/theme-dark/dark.scss";
import * as validator from "validator";

export async function enable_2fa() {
    const data = await post(`/otp/setup`);

	const promise = new Promise(async (resolve, reject) => {
		await Swal.fire({
		    title: "Setup 2FA",
		    footer: `${data.secret}`,
		    input: "text",
		    imageUrl: `${data.qr}`,
		    imageWidth: 400,
		    imageHeight: 400,
		    imageAlt: "2FA qr code",
		    showCancelButton: true,
		    confirmButtonText: "Setup",
		    showLoaderOnConfirm: true,
		    inputAutoTrim: true,
		    inputPlaceholder: "Enter your 2FA code",
		    inputValidator: (code) => {
				if (!validator.default.isLength(code, { min: 6, max: 6 }))
					return "OTP must be 6 characters long";
				if (!validator.default.isInt(code, { min: 0, max: 999999 }))
					return "OTP consist of only numbers";
				return null;
		    },
		    preConfirm: async (code) => {
				return post(`/otp/setup_verify`, { otp: code })
					.then((response) => {
						return null;
					})
					.catch((error) => {
						Swal.showValidationMessage(`Could not setup 2FA: ${error}`);
						reject();
					});
		    },
		    allowOutsideClick: () => !Swal.isLoading(),
		}).then((result) => {
		    if (result.isConfirmed) {
				Swal.fire({
					position: "top-end",
					icon: "success",
					title: "Successfully setup 2FA",
					showConfirmButton: false,
					timer: 1300,
				});
				resolve(result.value);
		    }
		});
	});
	    try {
		    await promise;
		    return true;
	    } catch (error) {
		    return false;
	    }
}

export async function disable_2fa() {
	const promise = new Promise(async (resolve, reject) => {
		await Swal.fire({
			title: "Are you sure?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Yes, disable 2FA",
			cancelButtonColor: "#d33",
			confirmButtonColor: "#198754",
			allowOutsideClick: () => !Swal.isLoading(),
			focusCancel: true,
			preConfirm: async () => {
			    return post(`/otp/disable`)
				.then((response) => {
				    return null;
				})
				.catch((error) => {
				    Swal.showValidationMessage(`Could not disable 2FA: ${error}`);
				    reject();
				});
			},
			}).then((result) => {
			if (result.isConfirmed) {
			    Swal.fire({
				position: "top-end",
				icon: "success",
				title: "Successfully disabled 2FA",
				showConfirmButton: false,
				timer: 1300,
			    });
			    resolve(result.value);
			}
		});
	});
	try {
		await promise;
		return true;
	} catch {
		return false;
	}
}
