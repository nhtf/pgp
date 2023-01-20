<script lang="ts">
    import { onMount } from "svelte";
    import { _default_profile_image } from "./+layout";
    import type { LayoutData } from "./$types";
    import { logout } from "./layout_log_functions";
    import Dropdownmenu from "$lib/dropdownmenu.svelte";

    export let data: LayoutData;

    const user = data.user;

    let currentTheme: string;
    const THEMES = {
        DARK: "dark",
        LIGHT: "light",
    };

    const STORAGE_KEY = "theme";
    const DARK_PREFERENCE = "(prefers-color-scheme: dark)";
    const prefersDarkThemes = () => window.matchMedia(DARK_PREFERENCE).matches;
    const toggleTheme = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(
                STORAGE_KEY,
                prefersDarkThemes() ? THEMES.LIGHT : THEMES.DARK
            );
        }
        applyTheme();
    };

    async function logoutfn() {
        let res = await logout();
        if (res) {
            if (data.user)
                data.user.username = ""; // CHECK
            window.location.href = "/";
        }
    }

    let drop1 = {
        options: {
            title: "okdrop", 
            data: [
                {text: "profile", fn: null, show: true, redir: `/profile/${data.user?.username}`},
                {text: "settings", fn: null, show: true, redir: "/settings"},
                {text: "lightmode", fn: toggleTheme, show: true, redir: null},
                {text: "darkmode", fn: toggleTheme, show: true, redir: null},
                {text: "logout", fn: logoutfn, show: true, redir: null},
            ],
            offsetx: 20,
            offsety: 60,
        },
        img: user?.avatar,
    };

    let drop2 = drop1;
    

    //TODO make it also change the options for the dropdownmenu
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
        window.fetch = data.fetch;
        applyTheme();
        window
            .matchMedia(DARK_PREFERENCE)
            .addEventListener("change", applyTheme);
        if (currentTheme === "dark") {
            drop1.options.data[3].show = false;
        }
        else
            drop1.options.data[2].show = false;
        drop2 = drop1;
        drop2.options.title = "okdrop1";
    });

    let hamburger = false;

    function changeHamburger() {
        hamburger = !hamburger;
    }

    function resetToggles() {
		var dropdowns = document.getElementsByClassName("dropdown-content");
		for (let i = 0; i < dropdowns.length; i++) {
			const dropDown = dropdowns[i] as HTMLElement;
			dropDown.style.display = "none";
		}
	}

    function clickfunction(event: MouseEvent) {
		if (!event || !event.target)
			return;
		const element = event.target as Element;
		if (!element.matches("#dropbtn"))
			resetToggles();
	}
</script>

<nav>
    <div class="menu">
        <ul id="nav-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/room">Room</a></li>
            <li><a href="/game">PongVR</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
            <div class="fill" />
            {#if !user?.username}
                <li><a href="http://localhost:3000/oauth/login">login</a></li>
            {:else}
                <Dropdownmenu drop={drop1}/>
            {/if}
        </ul>
        <ul id="mobile">
            <ul id="nav-menu-mobile">
                <div
                    class="hamburger"
                    on:click={changeHamburger}
                    on:keypress={changeHamburger}
                >
                    {#if !hamburger}
                        <div class="bar1" />
                        <div class="bar2" />
                        <div class="bar3" />
                    {:else}
                        <div class="bar1" id="change0" />
                        <div class="bar2" id="change1" />
                        <div class="bar3" id="change2" />
                    {/if}
                </div>
                {#if hamburger}
                    <li>
                        <ul id="ham-drop">
                            <li><a href="/">Home</a></li>
                            <li><a href="/room">Room</a></li>
                            <li><a href="/game">PongVR</a></li>
                            <li><a href="/leaderboard">Leaderboard</a></li>
                        </ul>
                    </li>
                {/if}
            </ul>
            <div class="fill" />
            <ul id="nav-menu-mobile">
                {#if !user?.username}
                    <li><a href="http://localhost:3000/oauth/login">login</a></li>
                {:else}
                    <Dropdownmenu drop={drop2}/>
                {/if}
            </ul>
        </ul>
    </div>
</nav>

<slot />

<svelte:window on:click={clickfunction} />

<style>

    .fill {flex: auto;}

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
        z-index: 100000;
    }

    .menu {
        /* display: flex; */
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
        box-shadow: 0 0 3px 2px var(--shadow-color);
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

    #nav-menu-mobile {
        display: none;
        flex-direction: column;
    }

    #mobile {
        display: none;
        justify-content: flex-start;
    }

    #ham-drop {
        right: 0;
        left: 0em;
        top: 6em;
        width: 175px;
    }

    @media (max-width: 500px) {
        #nav-menu {
            display: none;
        }
        #nav-menu-mobile {
            display: flex;
        }

        #mobile {
            display: flex;
        }
    }

    .bar1,
    .bar2,
    .bar3 {
        width: 35px;
        height: 3px;
        background-color: var(--ham-color);
        margin: 6px 0;
        transition: 0.4s;
    }

    #change0 {
        transform: translate(0, 14px) rotate(-45deg);
    }

    #change1 {
        opacity: 0;
    }

    #change2 {
        transform: translate(0, -14px) rotate(45deg);
    }

    .hamburger {
        display: inline-block;
        cursor: pointer;
        align-self: flex-start;
    }

    .swal2-container {
        z-index: 10000;
    }

</style>