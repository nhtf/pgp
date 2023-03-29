<script lang="ts">
	import type { UpdatePacket } from "$lib/types";
	import type { LayoutData } from "./$types";
	import type { Entity } from "$lib/entities";
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
	import "../app.postcss";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { BACKEND } from "$lib/constants";
	import { goto, invalidate } from "$app/navigation";
	import { disable_twofa, enable_twofa } from "$lib/two_factor";
	import { memberStore, userStore } from "$lib/stores";
	import { unwrap } from "$lib/Alert";
	import { post } from "$lib/Web";
    import { updateManager, updateSocket } from "$lib/updateSocket";
    import { Action, Subject } from "$lib/enums";
	import Notifications from "$lib/components/Notifications.svelte";

	export let data: LayoutData;

	const THEMES = { DARK: "dark", LIGHT: "light" };
	const STORAGE_KEY = "theme";
	const DARK_PREFERENCE = "(prefers-color-scheme: dark)";
	const HEARTBEATCOOLDOWN = 1000;

	let currentTheme: string;
	let timer: number | null = null;

	$: user = data.user ? $userStore.get(data.user.id) : null;
	$: twofa_enabled = user?.auth_req === 2;

	onMount(() => {
		applyTheme();
		window
			.matchMedia(DARK_PREFERENCE)
			.addEventListener("change", applyTheme);
	});

	updateManager.set(Subject.ROOM, async (update: UpdatePacket) => {
		if (update.action === Action.REMOVE && update.id === Number($page.params.id)) {
			const route = $page.url.toString().includes("chat") ? "chat" : "game";
	
			await goto(`/${route}`);
		}
	});

	updateManager.set(Subject.MEMBER, async (update: UpdatePacket) => {
		const id = Number($page.params.id);
		const member = $memberStore.get(update.id);

		if (update.action === Action.REMOVE
			&& member?.userId === $page.data.user.id
			&& Number($page.params.id) === member?.roomId
		) {
			const route = $page.url.toString().includes("chat") ? "chat" : "game";
	
			await goto(`/${route}`);
		}
	});

	addEventListener("mousemove", heartBeat);
	addEventListener("keypress", heartBeat);

	function heartBeat() {
		if (!timer) {
			updateSocket.emit("heartbeat");
			timer = setTimeout(() => {
				timer = null;
			}, HEARTBEATCOOLDOWN);
		}
	}

	function prefersDarkThemes() {
		return window.matchMedia(DARK_PREFERENCE).matches;
	}

	function toggleTheme () {
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

	async function logout() {
		await unwrap(post(`/oauth/logout`));
		await goto(`/`);
		await invalidate(`${BACKEND}/user/me`);
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

	const links = [
		{ url: "/chat", name: "Chat Rooms" },
		{ url: "/game", name: "Game Rooms" },
		{ url: "/leaderboard", name: "Leaderboard" },
		{ url: "/invite", name: "Invites" },
	];
</script>

<Navbar let:hidden let:toggle color="none" class="navbar-bg">
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
			<Avatar id="avatar-menu" src={user?.avatar} />
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
				<span class="block text-sm"> {user.username} </span>
			</DropdownHeader>
			<DropdownItem href="/profile/{encodeURIComponent(user.username)}"
				>profile</DropdownItem
			>
			{#if twofa_enabled}
				<DropdownItem on:click={disable_twofa}>disable 2fa</DropdownItem>
			{:else}
				<DropdownItem on:click={enable_twofa}>enable 2fa</DropdownItem>
			{/if}
			<DropdownItem>
				<Toggle
					size="small"
					checked={currentTheme === THEMES.DARK}
					on:change={toggleTheme}
					>dark
				</Toggle>
			</DropdownItem>
			<DropdownItem on:click={logout}>sign out</DropdownItem>
		</Dropdown>
	{/if}
	<NavUl {hidden} class="navbar-bg">
		<NavLi href="/" active={$page.url.pathname === "/"}>Home</NavLi>
		{#each links as { url, name }}
			<NavLi href={url} active={$page.url.pathname.includes(url)}>{name}</NavLi>
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
