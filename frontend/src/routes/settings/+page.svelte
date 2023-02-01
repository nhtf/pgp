<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import { FRONTEND } from "$lib/constants";
    import { put } from "$lib/Web";
	import type { PageData } from "./$types";
	import { disable_2fa, enable_2fa } from "./two_facter_functions";
	import { fly } from 'svelte/transition';
	import { Button, Dropdown, DropdownItem, Avatar, DropdownHeader, DropdownDivider } from 'flowbite-svelte'

	export let data: PageData;

	let user_icon = "Assets/icons/user.png";
	let security_icon = "Assets/icons/lock.png";

	let enabled_2fa = data.auth_req === 2;
	let two_fa = 'off';
	let username = data.user?.username;

	async function disable() {
		let res = await disable_2fa();
		if (res) {
			enabled_2fa = false;
			if (data.user) data.user.auth_req = 1;
			two_fa = 'off';
		}
	}

	async function enable() {
		let res = await enable_2fa();
		if (res) {
			enabled_2fa = true;
			if (data.user) data.user.auth_req = 2;
			two_fa = "on";
		}
	}

	async function changeUserName() {		
		let res = await unwrap(put("/user/me/username", {username}, true));
		const links = document.getElementsByTagName("a");
		for (let i = 0; i < links.length; i+=1) {
			if (links[i].href === FRONTEND + "/profile/" + data.user?.username) {
				links[i].href = FRONTEND + "/profile/" + username;
			}
		}
		data.user = res;
		data = data;
	}

	function changeSettingsTab(tab: string) {
		if (tab === "profile-information") {
			profile_visible = !profile_visible;
			security_visible = false;
		}
		else if (tab === "security") {
			security_visible = !security_visible;
			profile_visible = false;
		}
		console.log(profile_visible, security_visible);
	}
	let profile_visible = false;
	let security_visible = false;
</script>

<div class="block-container">
	<div class="block-vert">
		<div class="block-hor">
			<h1>Settings</h1>
		</div>
		<div class="block-hor" id="left-alligned">
			<div class="block-cell" >
				<img id="icon" src={user_icon} alt="user-icon">
			</div>
			<div class="block-cell">
				<h3 id="selector" on:click={() => {changeSettingsTab("profile-information")}}>Profile information</h3>
			</div>
		</div>
		<div class="block-hor" id="left-alligned">
			<div class="block-cell" >
				<img id="icon"  src={security_icon} alt="lock-icon">
			</div>
			<div class="block-cell">
				<h3 id="selector" on:click={() => {changeSettingsTab("security")}}>Security</h3>
			</div>
		</div>
	</div>
	{#if profile_visible}
	<div class="block-vert" id="profile-information" transition:fly="{{ x: -100, duration: 500 }}">
		<div class="block-hor">
			<h2>Profile Information</h2>
		</div>
		<div class="block-hor">
			<div class="block-cell">username</div>
		</div>
		<div class="block-hor">
			<input name="username" id="username-change" type="text" bind:value={username} minlength="3">
		</div>
		<div class="block-hor end"></div>
		<div class="block-hor right">
			<label id="save-button" for="username-change" on:click={changeUserName}>Save</label>
		</div>
	</div>
	{/if}
	{#if security_visible}
	<div class="block-vert" id="security" transition:fly="{{ x: -100, duration: 500 }}">
		<div class="block-hor">
			<h2>Security</h2>
		</div>
		<div class="block-hor">
			<div class="block-cell">two step verification is {two_fa}</div>
		</div>
		<div class="block-hor">
			{#if enabled_2fa}
				<div id="save-button" class="block-cell" on:click={disable} on:keypress={disable}>disable</div>
			{:else}
				<div id="save-button" class="block-cell" on:click={enable} on:keypress={enable}>Set up</div>
			{/if}
		</div>
	</div>
	{/if}
</div>

<style>
	:global(body) {
		font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
			Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", Helvetica,
			Arial, sans-serif;
	}

	.end {
		align-self: stretch;
		flex-grow: 1;
	}

	.right {
		align-self: flex-end;
	}

	#save-button {
		display: flex;
		position: relative;
		height: 30px;
		width: 100px;
		align-self: center;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		border-width: 1px;
		border-color: var(--scrollbar-thumb);
		border-style: solid;
		top: 20px;
		cursor: pointer;
	}

	#save-button:hover {
		background: var(--tab-active-color);
	}

	#profile-information {
		display: flex;
	}

	#security {
		display: flex;
	}

	#selector {
		cursor: pointer;
	}

	h1 {
		text-decoration: underline;
	}

	#icon {
		height: 30px;
		width: 30px;
		align-self: flex-start;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		padding-right: 15px;
		display: flex;
	}

	.block-cell {
		flex-grow: 1;
	}

	#left-alligned {
		align-self: flex-start;
	}

	.block-container {
		justify-content: flex-start;
	}

	*, ::before, ::after {
	box-sizing: unset;	
}
</style>
