import Swal from "sweetalert2";
import "@sweetalert2/theme-dark/dark.scss";
import * as validator from "validator";

export async function enable_2fa() {
    const response = await fetch("http://localhost:3000/otp/setup", {
        method: "POST",
        credentials: "include",
    });

    if (!response.ok) {
        console.error(response.statusText);
    } else {
        const data = await response.json();

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
            confirmButtonColor: "var(--confirm-color)",
            cancelButtonColor: "var(--cancel-color",
            background: "var(--box-color)",
            showLoaderOnConfirm: true,
            inputAutoTrim: true,
            inputPlaceholder: "Enter your 2FA code",
            inputValidator: (code) => {
                if (!validator.isLength(code, { min: 6, max: 6 }))
                    return "OTP must be 6 characters long";
                if (!validator.isInt(code, { min: 0, max: 999999 }))
                    return "OTP consist of only numbers";
            },
            preConfirm: (code) => {
                return fetch("http://localhost:3000/otp/setup_verify", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: `otp=${code}`,
                })
                    .then((response) => {
                        console.log(response);
                        if (!response.ok) {
                            throw new Error("not ok");
                        }
                        return "done";
                    })
                    .catch((error) => {
                        Swal.showValidationMessage(`Could not setup 2FA: ${error}`);
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
                return true;
            }
        });
    }
    return false;
}

export async function disable_2fa() {
    await Swal.fire({
        title: "Are you sure?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, disable 2FA",
        cancelButtonColor: "#d33",
        confirmButtonColor: "#198754",
        allowOutsideClick: () => !Swal.isLoading(),
        focusCancel: true,
        preConfirm: () => {
            return fetch("http://localhost:3000/otp/disable", {
                method: "POST",
                credentials: "include",
            })
                .then((response) => {
                    if (!response.ok) throw new Error(response.statusText);
                    return null;
                })
                .catch((error) => {
                    Swal.showValidationMessage(`Could not disable 2FA: ${error}`);
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
            return true;
        }
    });
    return false;
}

export async function logout() {
    const response = await fetch("http://localhost:3000/oauth/logout", {
        method: "POST",
        credentials: "include",
    });

    if (!response.ok) {
        const info = await response.json();
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: false
        });

        Toast.fire({
            icon: "error",
            title: info.message,
        });
        return false;
    }
    else {
        return true;
    }
}