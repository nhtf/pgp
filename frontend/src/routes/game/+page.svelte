<script lang="ts">
	import { BACKEND } from "$lib/constants";
	import { post, remove } from "$lib/Web";
	import { unwrap } from "$lib/Alert";
	import { invalidate } from "$app/navigation";
	import type { PageData } from "./$types";

	export let data: PageData;

	const room = {
		name: "",
		is_private: false,
		password: "",
	};

	async function createGame() {
		await unwrap(post("/game", room));
		await invalidate(`${BACKEND}/game?member=true`);
	}

	async function deleteGame(room) {
		await unwrap(remove(`/game/id/${room.id}`));
		await invalidate(`${BACKEND}/game?member=true`);
	}

	async function leaveGame(room) {
		await unwrap(remove(`/game/id/${room.id}/leave`));
		await invalidate(`${BACKEND}/game?member=true`);
		await invalidate(`${BACKEND}/game?member=false`);
	}

	async function joinGame(room) {
		await unwrap(post(`/game/id/${room.id}/member`));
		await invalidate(`${BACKEND}/game?member=true`);
		await invalidate(`${BACKEND}/game?member=false`);
	}
</script>

<div class="room-container">
	<div class="room room-create">
		<div>
			<input class="input" placeholder="Room name" bind:value={room.name}>
			{#if room.is_private}
				<input class="input" placeholder="Room password" bind:value={room.password}>
			{/if}<br>
			<input class="input" type="checkbox" bind:checked={room.is_private}>
			<span class="label">Private</span>
		</div>
		<button class="button button-create" on:click={createGame}>Create</button>
	</div>
	{#each data.mine as room}
		<div class="room room-mine">
			<span class="room-name">{room.name}</span>
			<a class="button button-enter" href=/game/{room.id}>Enter</a>
			{#if room.owner.id == data.user.id}
				<button class="button button-delete" on:click={() => deleteGame(room)}>Delete</button>
			{:else}
				<button class="button button-leave" on:click={() => leaveGame(room)}>Leave</button>
			{/if}
		</div>
	{/each}
	{#each data.joinable as room}
		<div class="room room-joinable">
			<span class="room-name">{room.name}</span>
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

	.button, .input {
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

	.input[type="text"] {
		width: 200px;
	}

	.input[type="checkbox"] {
		width: 30px;
		height: 30px;
		vertical-align: top;
	}

	.button-create, .button-join {
		border-color: var(--green);
	}

	.button-delete, .button-leave {
		border-color: var(--red);
	}

	.button-enter {
		border-color: var(--blue);
	}

	br {
		margin-bottom: 10px;
	}
</style>
