<script lang="ts">
  import "../app.postcss";
  import { onMount } from "svelte";
  import type { LayoutData } from "./$types";
  import { logout } from "./layout_log_functions";
  import { page } from "$app/stores";

  import { io } from "socket.io-client";
  import { BACKEND_ADDRESS } from "$lib/constants";
  import { Button, Dropdown, DropdownItem, Avatar, DropdownHeader, DropdownDivider, ToolbarButton, Navbar, NavBrand, NavHamburger, NavLi, NavUl, Chevron } from 'flowbite-svelte'

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

  function resetToggles() {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      const dropDown = dropdowns[i] as HTMLElement;
      dropDown.style.display = "none";
    }
  }

  function clickfunction(event: MouseEvent) {
    if (!event || !event.target) return;
    const element = event.target as Element;
    if (!element.matches("#dropbtn")) resetToggles();
  }

  function activepage() {
    console.log($page.params);
  }
  console.log($page.url.pathname);
</script>


<Navbar let:hidden let:toggle rounded color="default">
  <NavBrand href="/">
    <img src="/favicon.png" class="mr-3 h-6 sm:h-9" alt="pgp logo"/>
    <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">PGP</span>
  </NavBrand>
    
    <NavUl {hidden} >
      <NavLi href="/" active={$page.url.pathname === "/"}>Home</NavLi>
      <NavLi href="/room" active={$page.url.pathname === "/room"}>Room</NavLi>
      <NavLi href="/game" active={$page.url.pathname === "/game"}>PongVR</NavLi>
      <NavLi href="/leaderboard" active={$page.url.pathname === "/leaderboard"}>Leaderboard</NavLi>
      <NavLi href="/invite" active={$page.url.pathname === "/invite"}>Invite</NavLi>
      {#if !user?.username}
        <NavLi active={true} href={`http://${BACKEND_ADDRESS}/oauth/login`}>login</NavLi>
      {/if}
      </NavUl>
      {#if user?.username}
      <div class="flex items-center md:order-2">
        <Avatar id="avatar-menu"  src={data.user.avatar} />
        <NavHamburger on:click={toggle} class1="w-full md:flex md:w-auto md:order-1"/>
      </div>
      <Dropdown triggeredBy="#avatar-menu" placement="bottom">
        <DropdownHeader>
          <span class="block text-sm"> {data.user.username} </span>
        </DropdownHeader>
        <DropdownItem href="/profile/{data.user.username}">profile</DropdownItem>
        <DropdownItem href="/settings">settings</DropdownItem>
        <DropdownItem on:click={toggleTheme}>{currentTheme}</DropdownItem>
        <DropdownItem on:click={logoutfn} slot="footer">Sign out</DropdownItem>
      </Dropdown>
    {/if}
      <!-- {#if !user?.username} -->
      <!-- <div class="flex md:order-2"> -->
        <!-- <Button size="sm"> -->
          <!-- <NavLi href={`http://${BACKEND_ADDRESS}/oauth/login`}>login</NavLi> -->
        <!-- </Button> -->
      <!-- </div> -->
      <!-- {/if} -->
</Navbar>

<!-- <nav>
  <div class="menu">
    <ul id="nav-menu">
      <li><a href="/">Home</a></li>
      <li><a href="/room">Room</a></li>
      <li><a href="/game">PongVR</a></li>
      <li><a href="/leaderboard">Leaderboard</a></li>
      <li><a href="/invite">Invite</a></li>
      <div class="fill" />
      {#if !user?.username}
        <li><a href={`http://${BACKEND_ADDRESS}/oauth/login`}>login</a></li>
      {:else}
      <Avatar class="acs" src={data.user.avatar} dot={{color:'bg-green-400'}} />
      <Dropdown triggeredBy=".acs">
        <div slot="header" class="px-4 py-2">
          <span class="block text-sm text-gray-900 dark:text-white"> {data.user.username} </span>
        </div>
        <DropdownItem href="/profile/{data.user.username}">profile</DropdownItem>
        <DropdownItem href="/settings">settings</DropdownItem>
        <DropdownItem on:click={toggleTheme}>{currentTheme}</DropdownItem>
        <DropdownItem on:click={logoutfn} slot="footer">Sign out</DropdownItem>
      </Dropdown>
      {/if}
    </ul>
    <ul id="mobile">
      <ul id="nav-menu-mobile">
        <ToolbarButton class="dots-menu text-gray-900 bg-white dark:text-white dark:bg-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
        </ToolbarButton>
        <Dropdown triggeredBy=".dots-menu">
          <DropdownItem href="/">Home</DropdownItem>
          <DropdownItem href="/room">Room</DropdownItem>
          <DropdownItem href="/game">PongVR</DropdownItem>
          <DropdownItem href="/leaderboard">Leaderboard</DropdownItem>
          <DropdownItem href="/invite">Invite</DropdownItem>
        </Dropdown> -->
        <!-- <div
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
              <li><a href="/invite">Invite</a></li>
            </ul>
          </li>
        {/if} -->
      <!-- </ul>
      <div class="fill" />
      <ul id="nav-menu-mobile">
        {#if !user?.username}
          <li>
            <a href={`http://${BACKEND_ADDRESS}/oauth/login`}>login</a>
          </li>
        {:else}
        <Avatar class="acs" src={data.user.avatar} dot={{color:'bg-green-400'}} />
        <Dropdown triggeredBy=".acs">
          <div slot="header" class="px-4 py-2">
            <span class="block text-sm text-gray-900 dark:text-white"> {data.user.username} </span>
          </div>
          <DropdownItem href="/profile/{data.user.username}">profile</DropdownItem>
          <DropdownItem href="/settings">settings</DropdownItem>
          <DropdownItem on:click={toggleTheme}>{currentTheme}</DropdownItem>
          <DropdownItem on:click={logoutfn} slot="footer">Sign out</DropdownItem>
        </Dropdown>
        {/if}
      </ul>
    </ul>
  </div>
</nav> -->

<slot />

<svelte:window on:click={clickfunction} />

<style>
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
}
</style>
