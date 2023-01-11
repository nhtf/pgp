<script lang="ts">
    import { onMount } from 'svelte';
    import { _default_profile_image } from "./+layout";
    import type { LayoutData } from './$types';
    import Swal from "sweetalert2";
    import * as validator from "validator";
    export let data: LayoutData;
    let show = false;
    let enabled_2fa = data.auth_req === 2;

    async function enable_2fa() {
            const response = await fetch("http://localhost:3000/otp/setup", {
                    method: "POST",
                    credentials: "include",
            });

            if (!response.ok) {
                    console.error(response.message);
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
                                    enabled_2fa = true;
                            }
                    });
            }
    }

    async function disable_2fa() {
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
                            enabled_2fa = false;
                            data.auth_req = 1;
                    }
            });
    }

    async function logout() {
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
        }
    }

    let currentTheme: string;
	const THEMES = {
		DARK: 'dark',
		LIGHT: 'light',
	};
	const STORAGE_KEY = 'theme';
	const DARK_PREFERENCE = '(prefers-color-scheme: dark)';

	const prefersDarkThemes = () => window.matchMedia(DARK_PREFERENCE).matches;

	const toggleTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      // clear storage
      localStorage.removeItem(STORAGE_KEY);
    } else {
      // store opposite of preference
      localStorage.setItem(STORAGE_KEY, prefersDarkThemes() ? THEMES.LIGHT : THEMES.DARK);
    }
	applyTheme();
  };

  const applyTheme = () => {
    const preferredTheme = prefersDarkThemes() ? THEMES.DARK : THEMES.LIGHT;
    currentTheme = localStorage.getItem(STORAGE_KEY) ?? preferredTheme;

    if (currentTheme === THEMES.DARK) {
      document.body.classList.remove(THEMES.LIGHT);
      document.body.classList.add(THEMES.DARK);
    } else {
      document.body.classList.remove(THEMES.DARK);
      document.body.classList.add(THEMES.LIGHT);
    }
  };

  onMount(() => {
    applyTheme();
    window.matchMedia(DARK_PREFERENCE).addEventListener('change', applyTheme);
  });

  function toggle_dropdown(e: MouseEvent) {
        if (!e.target || !e.target.id || e.target.id !== "small-avatar")
            show = false;
        else
            show = !show;
    }
</script>

<nav>
    <div class="menu">
        <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/chat">Chat</a></li>
            <li><a href="/vrtest">PongVR</a></li>
            <div class="fill" />
            {#if !data.username}
                <li><a href="http://localhost:3000/oauth/login">login</a></li>
            {:else}
                <li>
                    <img
                        id="small-avatar"
                        src={data.avatar}
                        alt="small-avatar"
                    />
                    {#if show}
                    <ul>
                        <li><a href="/profile/{data.username}">Profile</a></li>
                        {#if enabled_2fa}
                            <li><a on:click={disable_2fa}>Disable 2FA</a></li>
                        {:else}
                            <li><a on:click={enable_2fa}>Enable 2FA</a></li>
                        {/if}
                        <li><a on:click={logout} href="/">Logout</a></li>
                        {#if currentTheme === THEMES.DARK}
                        <li on:click={toggleTheme}>lightmode</li>
                        {:else}
                        <li on:click={toggleTheme}>darkmode</li>
                        {/if}
                    </ul>
                    {/if}
                </li>
            {/if}
        </ul>
    </div>
</nav>

<slot />

<svelte:window on:click={toggle_dropdown}/>

<style> 

    #small-avatar {
        display: flex;
        max-width: 35px;
        max-height: 35px;
        border-radius: 50%;
        margin-left: 5px;
    }

    #small-avatar:hover {
        box-shadow: 2px 2px 3px 2px rgba(var(--shadow-color));
    }

    .fill {
        flex: auto;
    }

    * {
        margin: 0;
        padding: 4px;
        box-sizing: border-box;
        font-family: "Poppins", sans-serif;
        color: var(--text-color);
        text-decoration: none;
    }

    nav {
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .menu {
        background: var(--box-color);
        position: sticky;
        top: 0;
        border-radius: 6px;
        border-color: var(--border-color);
        border-width: 2px;
        border-style: solid;
    }
    
    /* parent */
    .menu ul { 
        display: flex;
        justify-content: space-evenly;
        align-items: center;
    }

    /* children */
    .menu ul li {
        list-style: none;
        padding: 4px;
        display: flex;
        cursor: pointer;
    }

    .menu ul li a {
        padding: 5px 10px;
    }

    .menu ul li a:hover {
        /* background: var(--hover-color); */
        border-radius: 6px;
        box-shadow: 0 0 3px 2px rgba(var(--shadow-color));
    }

    .menu ul li ul li:hover {
        border-radius: 6px;
        padding-top: 5px;
    }

    .menu ul li ul {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 3em;
        right: 0em;
        background: var(--box-color);
        border-radius: 6px;
        box-shadow: 0px 10px 10px 0px rgba(0, 0, 0, 0.5);
    }

</style>
