<script lang="ts">
	import { BACKEND } from "$lib/constants";
	import { post, remove } from "$lib/Web";
	import { unwrap } from "$lib/Alert";
	import { invalidate } from "$app/navigation";
	import { Access } from "$lib/types";
	import type { PageData } from "./$types";
	import { Checkbox, Select } from "flowbite-svelte";

	export let data: PageData;

	let name = "";
	let is_private = false;
	let password = "";
	let gamemode = 0;

	async function createGame() {
		const room: any = {};

		room.name = name;
		room.is_private = is_private;
		room.gamemode = gamemode;

		if (!is_private && password.length > 0) {
			room.password = password;
		}

		if (!room.name.length) {
			delete room.name;
		}

		await unwrap(post("/game", room));
		await invalidate(`${BACKEND}/game?member=true`);
	}

	async function deleteGame(room: any) {
		await unwrap(remove(`/game/id/${room.id}`));
		await invalidate(`${BACKEND}/game?member=true`);
	}

	async function leaveGame(room: any) {
		await unwrap(remove(`/game/id/${room.id}/member/me`));
		await invalidate(`${BACKEND}/game?member=true`);
		await invalidate(`${BACKEND}/game?member=false`);
	}

	async function joinGame(room: any) {
		await unwrap(post(`/game/id/${room.id}/member`, { password: room.data_password }));
		await invalidate(`${BACKEND}/game?member=true`);
		await invalidate(`${BACKEND}/game?member=false`);
	}

	async function inviteUser(room: any) {
		await unwrap(post(`/game/id/${room.id}/invite`, { username: room.data_username }));
	}

	const i_path = "/Assets/icons/";
	const icons = [`${i_path}pong-classic.svg`, `${i_path}vr.svg`, `${i_path}hexagon.svg`];

	const gamemodes = [
		{value:0, name: "Classic"},
		{value:1, name: "VR"},
		{value:2, name: "Modern"},
	];
</script>

<div class="room-container">
	<div class="room room-create">
		<div>
			<input class="input" type="text" placeholder="Room name" bind:value={name}>
			<Select defaultClass="select" items={gamemodes} placeholder="Gamemode" bind:value={gamemode}/><p/>
			<input class="input" type="text" placeholder="Room password" bind:value={password} disabled={is_private}>
			<Checkbox bind:checked={is_private} class="checkbox"></Checkbox>
			<span class="label">Private</span>
		</div>
		<button class="button button-create" on:click={createGame}>Create</button>
	</div>
	{#each data.mine as room}
		<div class="room room-mine">
			<div class="room-name">
				<div>{room.name}</div>
				<img class="icon {gamemodes[room.gamemode].name}" src={icons[room.gamemode]} alt={gamemodes[room.gamemode].name} title={gamemodes[room.gamemode].name}>
			</div>
			{#if room.owner?.id === data.user?.id}
				<input class="input" placeholder="Username" bind:value={room.data_username}>
				<button class="button button-invite" on:click={() => inviteUser(room)}>Invite</button>
			{/if}
			<a class="button button-enter" href=/game/{room.id}>Enter</a>
			{#if room.owner?.id === data.user?.id}
				<button class="button button-delete" on:click={() => deleteGame(room)}>Delete</button>
			{:else}
				<button class="button button-leave" on:click={() => leaveGame(room)}>Leave</button>
			{/if}
		</div>
	{/each}
	{#each data.joinable as room}
		<div class="room room-joinable">
			<span class="room-name">
				<div>{room.name}</div>
				<img class="icon {gamemodes[room.gamemode].name}" src={icons[room.gamemode]} alt={gamemodes[room.gamemode].name} title={gamemodes[room.gamemode].name}>
			</span>
			{#if room.access === Access.PROTECTED}
				<input class="input" placeholder="Password" bind:value={room.data_password}>
			{/if}
			<button class="button button-join" on:click={() => joinGame(room)}>Join</button>
		</div>
	{/each}
</div>

<style>
	/* instead of the br so it is the same for chrome and firefox */
	p {
		margin-top: 0.375rem;
	}

	.room-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 25px 10px;
	}

	.icon {
		width: 20px;
		height: 20px;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		margin-left: 0.5rem;
		margin-top: 5px;
		align-self: center;
	}

	.VR {
		-webkit-filter: unset;
		filter: unset;
		background-color: var(--box-hover-color);
		border-radius: 6px;
	}

	.room {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		background: var(--box-color);
		border: 2px var(--border-color);
		border-radius: 6px;
		padding: 25px;
	}

	.room-name {
		flex-grow: 1;
		font-size: 1.25em;
		flex-direction: row;
		display: flex;
		align-items: center;
	}

	.label {
		line-height: 30px;
	}

	.button, .input, .select {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
	}

	.button {
		width: 80px;
		text-align: center;
	}

	.input[type="text"], .select {
		width: 200px;
	}

	/* .input[type="checkbox"] {
		width: 30px;
		height: 30px;
		vertical-align: top;
	} */

	.input:disabled {
		opacity: 0.25;
	}

	.button-create, .button-join, .button-invite {
		border-color: var(--green);
	}

	.button-delete, .button-leave {
		border-color: var(--red);
	}

	.button-enter {
		border-color: var(--blue);
	}
</style>
