<script lang="ts">
  import "../app.postcss";
  import { onMount } from "svelte";
  import type { LayoutData } from "./$types";
  import { logout } from "./layout_log_functions";
  import { page } from "$app/stores";

  import { io } from "socket.io-client";
  import { BACKEND_ADDRESS, BACKEND } from "$lib/constants";
  import {
    Dropdown,
    DropdownItem,
    Avatar,
    DropdownHeader,
    Navbar,
    NavBrand,
    NavHamburger,
    NavLi,
    NavUl,
  } from "flowbite-svelte";

  export let data: LayoutData;

  const user = data.user;

  let currentTheme: string;
  const THEMES = {
    DARK: "dark",
    LIGHT: "light",
  };

  const socket = io(`ws://${BACKEND_ADDRESS}/update`, {
    withCredentials: true,
  });

  socket.on("update", (message) => {
    console.log(message);
  });

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
      if (data.user) data.user = null; // CHECK
      window.location.href = "/";
    }
  }

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
    window.matchMedia(DARK_PREFERENCE).addEventListener("change", applyTheme);
  });

  console.log("$page: ", $page);
  const links = [
    { url: "/room", name: "Chat Rooms" },
    { url: "/game", name: "Game Rooms" },
    { url: "/leaderboard", name: "Leaderboard" },
    { url: "/invite", name: "Invites" },
  ];
</script>

<Navbar let:hidden let:toggle rounded color="none" class="navbar-bg">
  <NavBrand href="/">
    <img src="/favicon.png" class="mr-3 h-6 sm:h-9" alt="pgp logo" />
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">PGP</span>
  </NavBrand>
  <div class="flex items-center md:order-2">
    <NavHamburger
      on:click={toggle}
      class1="w-full md:flex md:w-auto md:order-1"
    />
    {#if user?.username}
    <Avatar id="avatar-menu" src={data.user.avatar} />
    {/if}
  </div>
  {#if user?.username}
    <Dropdown triggeredBy="#avatar-menu" placement="bottom" class="background-color-custom border-color-custom">
      <DropdownHeader>
        <span class="block text-sm"> {data.user.username} </span>
      </DropdownHeader>
      <DropdownItem href="/profile/{data.user.username}">profile</DropdownItem>
      <DropdownItem href="/settings">settings</DropdownItem>
      <DropdownItem on:click={toggleTheme}>{currentTheme}</DropdownItem>
      <DropdownItem on:click={logoutfn}>Sign out</DropdownItem>
    </Dropdown>
  {/if}
  <NavUl {hidden} class="navbar-bg">
    <NavLi href="/" active={$page.url.pathname === "/"}>Home</NavLi>
    {#each links as { url, name }}
      <NavLi href={url} active={$page.url.pathname.includes(url)}>{name}</NavLi>
    {/each}
    {#if !user?.username}
      <NavLi active={true} href={`${BACKEND}/oauth/login`} activeClass="login-button" nonActiveClass="login-button">login</NavLi>
    {/if}
  </NavUl>
</Navbar>

<slot />

<style>



  /* * {
    margin: 0;
    padding: 4px;
    box-sizing: border-box;
    font-family: "Poppins", sans-serif;
    color: var(--text-color);
    text-decoration: none;
  } */

  /* nav {
    position: sticky;
    top: 0;
    z-index: 100000;
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

  .menu ul {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

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

  .dark .dark\:bg-gray-700 {
    background: var(--box-color);
    background-color: var(--box-color);
  } */
</style>
