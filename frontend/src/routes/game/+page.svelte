<script lang="ts">
	import { BACKEND } from "$lib/constants";
	import { post, remove } from "$lib/Web";
	import { unwrap } from "$lib/Alert";
	import { invalidate } from "$app/navigation";
	import { Access, Gamemode } from "$lib/types";
	import type { PageData } from "./$types";

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

		await unwrap(post("/game", room));
		await invalidate(`${BACKEND}/game?member=true`);
	}

	async function deleteGame(room: any) {
		await unwrap(remove(`/game/id/${room.id}`));
		await invalidate(`${BACKEND}/game?member=true`);
	}

	async function leaveGame(room: any) {
		await unwrap(remove(`/game/id/${room.id}/member/${data.user?.id}`));
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
</script>

<div class="room-container">
	<div class="room room-create">
		<div>
			<input class="input" placeholder="Room name" bind:value={name}>
			<select class="select" bind:value={gamemode}>
				<option value={Gamemode.REGULAR}>Classic</option>
				<option value={Gamemode.VR}>Vr</option>
			</select><br>
			<input class="input" placeholder="Room password" bind:value={password} disabled={is_private}>
			<input class="input" type="checkbox" bind:checked={is_private}>
			<span class="label">Private</span>
		</div>
		<button class="button button-create" on:click={createGame}>Create</button>
	</div>
	{#each data.mine as room}
		<div class="room room-mine">
			<span class="room-name">
				{room.name}
				{#if room.gamemode === Gamemode.VR}
					&#x1F97D;
				{/if}
			</span>
			{#if room.owner?.id === data.user.id}
				<input class="input" placeholder="Username" bind:value={room.data_username}>
				<button class="button button-invite" on:click={() => inviteUser(room)}>Invite</button>
			{/if}
			<a class="button button-enter" href=/game/{room.id}>Enter</a>
			{#if room.owner?.id === data.user.id}
				<button class="button button-delete" on:click={() => deleteGame(room)}>Delete</button>
			{:else}
				<button class="button button-leave" on:click={() => leaveGame(room)}>Leave</button>
			{/if}
		</div>
	{/each}
	{#each data.joinable as room}
		<div class="room room-joinable">
			<span class="room-name">
				{room.name}
				{#if room.gamemode === Gamemode.VR}
					&#x1F97D;
				{/if}
			</span>
			{#if room.access === Access.PROTECTED}
				<input class="input" placeholder="Password" bind:value={room.data_password}>
			{/if}
			<button class="button button-join" on:click={() => joinGame(room)}>Join</button>
		</div>
	{/each}
</div>

<style>
	.room-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 25px 10px;
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

	.input[type="checkbox"] {
		width: 30px;
		height: 30px;
		vertical-align: top;
	}

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

	br {
		width: 1px;
		margin-bottom: 10px;
	}
</style>
