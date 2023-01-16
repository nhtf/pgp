<script lang="ts">
    import { onMount } from 'svelte';
    import { _default_profile_image } from "./+layout";
    import type { LayoutData } from './$types';
    import {enable_2fa, disable_2fa, logout } from "./layout_log_functions";
    export let data: LayoutData;
    let show = false;

    let two_fa_enable = data.auth_req == 2;

    let currentTheme: string;
	const THEMES = {
		DARK: 'dark',
		LIGHT: 'light',
	};
	const STORAGE_KEY = 'theme';
	const DARK_PREFERENCE = '(prefers-color-scheme: dark)';
	const prefersDarkThemes = () => window.matchMedia(DARK_PREFERENCE).matches;
	const toggleTheme = () => {const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        localStorage.removeItem(STORAGE_KEY);
    } else {
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
    window.fetch = data.fetch;
    applyTheme();
    window.matchMedia(DARK_PREFERENCE).addEventListener('change', applyTheme);
  });

  function toggle_dropdown(e: MouseEvent) {
        if (!e.target || !e.target.id || e.target.id !== "small-avatar")
            show = false;
        else
            show = !show;
    }

    let hamburger = false;

    function changeHamburger() {
       hamburger = !hamburger;
    }

    async function disable() {
        let res = await disable_2fa();
        if (res) {
            two_fa_enable = false;
            data.auth_req = 1;
        }
    }

    async function enable() {
        let res = await disable_2fa();
        if (res) {
            two_fa_enable = true;
            data.auth_req = 2;
        }
    }
</script>

<nav>
    <div class="menu">
        <ul id="nav-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/chat">Chat</a></li>
            <li><a href="/game">PongVR</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
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
                        {#if two_fa_enable}
                            <li><a on:click={disable}>Disable 2FA</a></li>
                        {:else}
                            <li><a on:click={enable}>Enable 2FA</a></li>
                        {/if}
                        <li><a on:click={logout} href="/">Logout</a></li>
                        {#if currentTheme === THEMES.DARK}
                        <li id="theme-mode" on:click={toggleTheme}>lightmode</li>
                        {:else}
                        <li id="theme-mode" on:click={toggleTheme}>darkmode</li>
                        {/if}
                    </ul>
                    {/if}
                </li>
            {/if}
        </ul>
        <ul id="mobile">
        <ul id="nav-menu-mobile">
            <div class="hamburger" on:click={changeHamburger} on:keypress={changeHamburger}>
                {#if !hamburger}
                <div class="bar1"></div>
                <div class="bar2"></div>
                <div class="bar3"></div>
                {:else}
                <div class="bar1" id="change0"></div>
                <div class="bar2" id="change1"></div>
                <div class="bar3" id="change2"></div>
                {/if}
            </div>
            {#if hamburger}
            <li><ul id="ham-drop">
            <li><a href="/">Home</a></li>
            <li><a href="/chat">Chat</a></li>
            <li><a href="/game">PongVR</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
        </ul>
            </li>
            {/if}
        </ul>
        <div class="fill" />
        <ul id="nav-menu-mobile">
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
                        {#if two_fa_enable}
                            <li><a on:click={disable}>Disable 2FA</a></li>
                        {:else}
                            <li><a on:click={enable}>Enable 2FA</a></li>
                        {/if}
                        <li><a on:click={logout} href="/">Logout</a></li>
                        {#if currentTheme === THEMES.DARK}
                        <li id="theme-mode" on:click={toggleTheme}>lightmode</li>
                        {:else}
                        <li id="theme-mode" on:click={toggleTheme}>darkmode</li>
                        {/if}
                    </ul>
                    {/if}
                </li>
            {/if}
        </ul>
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
        box-shadow: 0 0 3px 2px rgba(var(--shadow-color));
    }

    #theme-mode:hover {
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

    @media (max-width: 450px) {
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

    .bar1, .bar2, .bar3 {
        width: 35px;
        height: 3px;
        background-color: rgb(255, 255, 255);
        margin: 6px 0;
        transition: 0.4s;
    }

    #change0 {
  transform: translate(0, 14px) rotate(-45deg);
}

#change1 {opacity: 0;}

#change2 {
  transform: translate(0, -14px) rotate(45deg);
}

    .hamburger {
        display: inline-block;
        cursor: pointer;
        align-self: flex-start;
    }

</style>
