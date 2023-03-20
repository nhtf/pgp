<script lang="ts">
	import type { Team, ChatRoom, GameRoom, GameState } from "$lib/entities";
    import type { UpdatePacket } from "$lib/types";
	import { Action, Gamemode, Subject } from "$lib/enums";
	import { page } from "$app/stores";
	import { swal, unwrap } from "$lib/Alert";
	import { icon_path } from "$lib/constants";
	import { Access } from "$lib/enums";
	import { post, remove, patch, get } from "$lib/Web";
	import { gameStateStore, playerStore, teamStore, userStore } from "$lib/stores";
    import { onDestroy, onMount } from "svelte";
    import { updateManager } from "$lib/updateSocket";
	import Invite from "./Invite.svelte";

	type T = ChatRoom & GameRoom;

	export let room: T;

	const crown = `${icon_path}/crown.svg`;
	const gamemode_icons = [
		`${icon_path}/pong-classic.svg`,
		`${icon_path}/vr.svg`,
		`${icon_path}/hexagon.svg`,
		`${icon_path}/hexagon4p.svg`,
	];

	console.log(room.state);

	const route = room.type.replace("Room", "").toLowerCase();
	const icon = (room.type === "GameRoom" ? 
		(room.state.gamemode === Gamemode.MODERN && room.state.teams?.length === 4 ? 
			gamemode_icons[3] : gamemode_icons[room.state.gamemode]) : null);

	let password = "";
	let state: GameState | null = room.state ?? null;
	let player = room.self?.player ?? null;
	let index: number;

	$: user = $userStore.get($page.data.user?.id)!;
	$: owner = room.owner ? $userStore.get(room.owner.id)! : null;
	$: state = state ? $gameStateStore.get(state.id)! : null;
	$: player = player ? $playerStore.get(player.id)! : null;

	onMount(() => {
		const teamIds = room.state?.teams?.map((team) => team.id) ?? null;

		index = updateManager.set(Subject.PLAYER, (update: UpdatePacket) => {
			if (update.action === Action.INSERT && teamIds.includes(update.value.teamId)) {
				player = update.value;
			}
		});
	});

	onDestroy(() => {
		updateManager.remove(index);
	});

	function teamSelector(room: T): Promise<number | null> {
		const inputOptions = room.state.teams.reduce((acc, team) => { return { ...acc, [team.id]: team.name } }, { "0": "spectate" });
		const promise = swal().fire({
			input: "radio",
			inputOptions,
			confirmButtonText: "Join",
			showCancelButton: true,
			width: "auto",
		}).then(({ isConfirmed, value }) => {
			if (!isConfirmed) {
				throw new Error("No team selected");
			}
		
			return value > 0 ? value : null;
		});

		const elements = document.getElementsByName("swal2-radio") as NodeListOf<HTMLInputElement>;
		const element = [...elements].find((element) => Number(element.value) === (player?.teamId ?? 0))!;

		element.checked = true;
	
		return promise;
	}

	async function join(room: T) {
		const body: any = {};

		if (password) {
			body.password = password;
		}

		if (room.type === "GameRoom") {
			if (!room.state.teamsLocked) {
				try {
					body.id = await teamSelector(room);
				} catch (_) {
					return;
				}
			} else {
				body.id = null;
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
	
	async function changeTeam(room: T) {
		try {
			const teamId = await teamSelector(room);
		
			await unwrap(patch(`/game/id/${room.id}/team/${room.self!.id}`, { team: teamId }));
			
		} catch (_) {}
	}

	async function lock(room: T) {
		await unwrap(post(`/game/id/${room.id}/lock`));
	}

</script>

<div class="room" style={`filter: brightness(${room.joined ? "100" : "80"}%)`}>
	{#if room.type === "ChatRoom" && owner}
		<img class="avatar" src={owner.avatar} alt="avatar"/>
	{:else}
		<img class="icon" src={icon} alt="icon"/>
	{/if}
	<div class="room-name">{room.name}</div>
	{#if owner && owner.id === user.id}
		<img class="icon-owner" src={crown} alt="crown"/>
	{/if}
	<!-- {#if room.access === Access.PROTECTED}
		<img class="icon" src={`${icon_path}/lock.svg`} alt="lock"/>
	{/if} -->
	<div class="grow"/>
	{#if room.joined}
		{#if owner && owner.id === user.id}
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
		{#if state && !state.teamsLocked}
			<button class="button border-yellow" on:click={() => changeTeam(room)}>Change team</button>
		{/if}
		<a class="button border-blue" href={`/${route}/${room.id}`}>{room.type === "ChatRoom" ? "Enter" : player ? `Play as ${player.team.name}` : "Spectate"}</a>
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
