<script lang="ts">
	import type { Team, ChatRoom, GameRoom, GameState } from "$lib/entities";
    import type { UpdatePacket } from "$lib/types";
	import { Action, Gamemode, Subject } from "$lib/enums";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { swal, unwrap } from "$lib/Alert";
	import { icon_path } from "$lib/constants";
	import { Access } from "$lib/enums";
	import { post, remove, patch, get } from "$lib/Web";
	import { gameStateStore, playerStore, userStore } from "$lib/stores";
    import { byId } from "$lib/sorting";
    import { onDestroy, onMount } from "svelte";
    import { updateManager } from "$lib/updateSocket";
	import Invite from "./Invite.svelte";
    import { error } from "@sveltejs/kit";

	type T = ChatRoom & GameRoom;

	export let room: T;

	const crown = `${icon_path}/crown.svg`;
	const gamemode_icons = [
		`${icon_path}/pong-classic.svg`,
		`${icon_path}/vr.svg`,
		`${icon_path}/hexagon.svg`,
		`${icon_path}/hexagon4p.svg`,
	];

	const route = room.type.replace("Room", "").toLowerCase();
	const icon = (room.type === "GameRoom" ? 
		(room.gamemode === Gamemode.MODERN && room.teams?.length === 4 ? 
			gamemode_icons[3] : gamemode_icons[room.gamemode]) : null);

	const teamIds = room.state?.teams?.map((team) => team.id) ?? null;

	let password = "";
	let state: GameState | null = room.state ?? null;
	let player = room.self?.player ?? null;
	let index: number;

	$: user = $userStore.get($page.data.user?.id)!;
	$: owner = $userStore.get(room.owner!.id)!;
	$: state = state ? $gameStateStore.get(state.id)! : null;
	$: player = player ? $playerStore.get(player.id)! : null;

	onMount(() => {
		index = updateManager.set(Subject.PLAYER, (update: UpdatePacket) => {
			if (update.action === Action.INSERT && teamIds.includes(update.value.teamId)) {
				player = update.value;
			}
		});

	});

	onDestroy(() => {
		updateManager.remove(index);
	});

	async function teamSelector(room: T): Promise<number | null> {
		const inputOptions = new Map<number | null, string>(room.teams.map((team) => [team.id, team.name]));

		inputOptions.set(null, "Spectate");
	
		await swal().fire({
			input: "radio",
			inputOptions,
			confirmButtonText: "Join",
			showCancelButton: true,
		}).then((result) => {
			if (result.isConfirmed) {
				return result.value;
			} else {
				throw error(418, "No team selected");
			}
		});

		return null;
	}

	async function join(room: T) {
		const body: any = {};

		if (password) {
			body.password = password;
		}

		if (room.type === "GameRoom") {
			try {
				body.id = await teamSelector(room);
			} catch (_) {
				return;
			}
		}
	
		await unwrap(post(`/${route}/id/${room.id}/members`, body));

		password = "";
	}

	async function leave(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}/members/me`));
	}
	
	async function erase(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}`));
	}
	
	async function editTeam(room: T, team: Team | null) {
		await unwrap(patch(`/game/id/${room.id}/team/${room.self!.id}`, { team: team ? team.id : null }));

		// await goto(`/game/${room.id}`);
	}

	async function lock(room: T) {
		await unwrap(post(`/game/id/${room.id}/lock`));
	}

	async function spectate(room: T) {
		await unwrap(patch(`/game/id/${room.id}/team/${room.self!.id}`));
		await goto(`/game/${room.id}`);
	}

</script>

<div class="room" style={`filter: brightness(${room.joined ? "100" : "80"}%)`}>
	{#if room.type === "ChatRoom"}
		<img class="avatar" src={owner?.avatar} alt="avatar"/>
	{:else}
		<img class="icon" src={icon} alt="icon"/>
	{/if}
	<div class="room-name">{room.name}</div>
	{#if owner?.id === user.id}
		<img class="icon-owner" src={crown} alt="crown"/>
	{/if}
	<!-- {#if room.access === Access.PROTECTED}
		<img class="icon" src={`${icon_path}/lock.svg`} alt="lock"/>
	{/if} -->
	<div class="grow"/>
	{#if room.joined}
		{#if owner?.id === user.id}
			<Invite {room}/>
			<button class="button border-red" on:click={() => erase(room)}>Delete</button>
			{#if room.type === "GameRoom" && !state?.teamsLocked}
				<button class="button border-yellow" on:click={() => lock(room)}>Lock teams</button>
			{/if}
			<!-- TODO: remove -->
			{#if room.type === "GameRoom" && state?.teamsLocked}
				<button class="button border-yellow" on:click={() => get(`/debug/unlock`, { id: room.id })}>Unlock</button>
			{/if}
		{:else}
			<button class="button border-red" on:click={() => leave(room)}>Leave</button>
		{/if}
		{#if room.type === "ChatRoom"}
			<a class="button border-blue" href={`/${route}/${room.id}`}>Enter</a>
		{:else}
			{#if !state?.teamsLocked}
				{#if player}
					<button class="button border-red" on:click={() => editTeam(room, null)}>Leave team</button>
					<a class="button border-blue" href={`/game/${room.id}`}>Play</a>
				{:else}
					{#each room.teams.sort(byId) as team (team.id)}
						<button class="button border-green" on:click={() => editTeam(room, team)}>Join {team.name}</button>
					{/each}
					<button class="button border-blue" on:click={() => spectate(room)}>Spectate</button>
				{/if}
			{:else}
				<a class="button border-blue" href={`/${route}/${room.id}`}>{player ? "Play" : "Spectate"}</a>
			{/if}
			<!-- <a class="button border-blue" href={`/game/${room.id}`}>Enter</a> -->
		{/if}
	{:else}
		{#if room.access === Access.PROTECTED}
			<input class="input" placeholder="Password" type="password" bind:value={password}>
		{/if}
		<button class="button border-green" on:click={() => join(room)}>Join</button>
	{/if}
</div>

<style>
	.room {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		background: var(--box-color);
		border-radius: 1rem;
		padding: 1rem;
		flex-wrap: wrap;
	}

	.room-name {
		font-size: larger;
		align-self: center;
	}

	.icon-owner {
		width: 1.5rem;
		height: 1.5rem;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		align-self: center;
	}

</style>
