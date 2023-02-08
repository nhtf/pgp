<script lang="ts">
	import "../app.postcss";
	import { onMount } from "svelte";
	import type { LayoutData } from "./$types";
	import { logout } from "./layout_log_functions";
	import { page } from "$app/stores";
	import Notifications from "./notifications.svelte";
	import { BACKEND,BACKEND_ADDRESS } from "$lib/constants";
	import { Subject, Action } from "$lib/types";
	import { io } from "socket.io-client";
	import { invalidate } from "$app/navigation";
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
		Toggle,
	} from "flowbite-svelte";
	import { goto } from "$app/navigation";
	import { disable_2fa, enable_2fa } from "./two_facter_functions";

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
	$: twofa_enabled = data.user?.auth_req === 2 || false;

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
			if (data.user) {
				data.user = null; // CHECK
			}
			goto(`/`);
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

	async function updateInvite(update: any) {
		if (update.subject === Subject.INVITES || update.subject === Subject.REQUESTS) {
			if (update.action === Action.ADD) {
				if (update.value.from.id !== user?.id)
					data.invites_received.push(update.value);
				else
					data.invites_send.push(update.value);
			}
			if (update.action === Action.REMOVE) {
				if (update.value.from.id !== user?.id) {
					console.log("before removal: ", data.invites_received);
					data.invites_received = data.invites_received.filter((invites) => invites.id !== update.identifier);
					console.log("after removal: ", data.invites_received);
				}
				else {
					console.log("before removal: ", data.invites_send);
					data.invites_send = data.invites_send.filter((invites) => invites.id !== update.identifier);
					console.log("after removal: ", data.invites_send);
				}
			}
			data.invites_received = data.invites_received;
			data.invites_send = data.invites_send;
			await invalidate(`${BACKEND}/user/me/invites`);
		}	
	}

	async function disable_twofa() {
		const res = await disable_2fa();
		if (res) {
			twofa_enabled = false;
		}
	}

	async function enable_twofa() {
		const res = await enable_2fa();
		if (res) {
			twofa_enabled = true;
		}
	}


	onMount(() => {
		applyTheme();
		window
			.matchMedia(DARK_PREFERENCE)
			.addEventListener("change", applyTheme);

		const socket = io(`ws://${BACKEND_ADDRESS}/update`, { withCredentials: true });
		socket.on("update", updateInvite);
	});

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
		<span
			class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
			>PGP</span
		>
	</NavBrand>
	<div class="flex items-center md:order-2">
		<NavHamburger
			on:click={toggle}
			class1="w-full md:flex md:w-auto md:order-1"
		/>
		{#if user?.username}
			<Avatar id="avatar-menu" src={data.user?.avatar} />
			<Notifications />
		{/if}
	</div>
	{#if user?.username}
		<Dropdown
			triggeredBy="#avatar-menu"
			placement="bottom"
			class="bg-c bor-c"
		>
			<DropdownHeader>
				<span class="block text-sm"> {data.user?.username} </span>
			</DropdownHeader>
			<DropdownItem href="/profile/{data.user?.username}"
				>profile</DropdownItem
			>
			{#if twofa_enabled}
			<DropdownItem on:click={disable_twofa}>disable 2fa</DropdownItem>
			{:else}
			<DropdownItem on:click={enable_twofa}>enable 2fa</DropdownItem>
			{/if}
			<DropdownItem
				><Toggle
					size="small"
					checked={currentTheme === THEMES.DARK}
					on:change={toggleTheme}>dark</Toggle
				></DropdownItem
			>
			<DropdownItem on:click={logoutfn}>sign out</DropdownItem>
		</Dropdown>
	{/if}
	<NavUl {hidden} class="navbar-bg">
		<NavLi href="/" active={$page.url.pathname === "/"}>Home</NavLi>
		{#each links as { url, name }}
			<NavLi href={url} active={$page.url.pathname.includes(url)}
				>{name}</NavLi
			>
		{/each}
		{#if !user?.username}
			<NavLi
				href={`${BACKEND}/oauth/login`}
				activeClass="login-button"
				nonActiveClass="login-button">login</NavLi
			>
		{/if}
	</NavUl>
</Navbar>

<slot />

<style>
</style>
