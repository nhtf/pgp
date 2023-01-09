<script lang="ts">
    import { onMount } from 'svelte';
    import { _default_profile_image } from "./+layout";
    /** @type {import('./$types').LayoutData} */
    export let data: {username: string, avatar: string};
    let show = false;

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
	console.log("currentTheme: ", currentTheme);
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
                        <li><a href="/settings">Settings</a></li>
                        <li><a href="http://localhost:3000/oauth/logout">Logout</a></li>
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
