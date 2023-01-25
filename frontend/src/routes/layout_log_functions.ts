import Swal from "sweetalert2";
import "@sweetalert2/theme-dark/dark.scss";
import { BACKEND_ADDRESS } from "$lib/constants";

export async function logout() {
    const response = await fetch(`http://${BACKEND_ADDRESS}/oauth/logout`, {
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