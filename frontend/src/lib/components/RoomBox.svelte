<script lang="ts">
	import type { GameRoom, Room } from "$lib/entities";
	import { gameStateStore, roomStore, userStore } from "$lib/stores";
	import { post, remove, patch, get } from "$lib/Web";
	import { icon_path } from "$lib/constants";
	import { unwrap } from "$lib/Alert";
	import { Access } from "$lib/enums";
	import { page } from "$app/stores";
	import Invite from "./Invite.svelte";
    import Swal from "sweetalert2";

	export let room: Room;

	const crown = `${icon_path}/crown.svg`;

	let password = "";

	$: room = $roomStore.get(room.id)!;
	$: state = (room as GameRoom).state ? $gameStateStore.get((room as GameRoom).state!.id)! : undefined;
	$: user = $userStore.get($page.data.user?.id)!;
	$: owner = room.ownerId ? $userStore.get(room.ownerId)! : undefined;
	$: team = state?.teams.find((team) => team.players?.some(({ userId }) => userId === user.id));

	function teamSelector(room: Room): Promise<number | null> {
		const inputOptions = state!.teams.reduce((acc, team) => { return { ...acc, [team.id]: team.name } }, { "0": "spectate" });
		const promise = Swal.fire({
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
		const element = [...elements].find((element) => Number(element.value) === (team?.id ?? 0))!;

		element.checked = true;
	
		return promise;
	}

	async function join(room: Room) {
		await unwrap(post(`${room.route}/members`, { password }));

		if (room.type === "GameRoom" && !state?.teamsLocked) {
			changeTeam(room);
		}
	
		password = "";
	}

	async function leave(room: Room) {
		await unwrap(remove(`${room.route}/members/me`, { ban: false }));
	}
	
	async function erase(room: Room) {
		await unwrap(remove(room.route));
	}
	
	async function changeTeam(room: Room) {
		try {
			const team = await teamSelector(room);
		
			await unwrap(patch(`${room.route}/team/${(room as GameRoom).self!.id}`, { team }));
			
		} catch (_) {}
	}

	async function lock(room: Room) {
		await unwrap(post(`${room.route}/lock`));
	}

</script>

<div class="room" style={`filter: brightness(${room.joined ? "100" : "80"}%)`}>
	{#if room.type === "ChatRoom"}
		<img class="avatar" src={owner?.avatar} alt="avatar"/>
	{:else if room.icon}
		<img class="icon" src={room.icon} alt="icon"/>
	{/if}
	<div class="room-name">{room.name}</div>
	{#if owner?.id === user.id}
		<img class="icon-owner" src={crown} alt="crown" title="You are the owner of this room"/>
	{/if}
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
		{#if state && !state.teamsLocked}
			<button class="button border-yellow" on:click={() => changeTeam(room)}>Change team</button>
		{/if}
		<a class="button border-blue" href={room.route}>{room.type === "ChatRoom" ? "Enter" : team ? `Play as ${team.name}` : "Spectate"}</a>
	{:else}
		{#if room.access === Access.PROTECTED}
			<input class="input" placeholder="Password" type="password" bind:value={password}>
		{/if}
		<button class="button border-green" on:click={() => join(room)}>Join</button>
	{/if}
</div>

<style>
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
