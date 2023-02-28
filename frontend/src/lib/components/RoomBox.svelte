<script lang="ts">
	import type { Team, ChatRoom, GameRoom } from "$lib/entities";
	import type { Gamemode } from "$lib/enums";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { unwrap } from "$lib/Alert";
    import { icon_path } from "$lib/constants";
	import { Access } from "$lib/enums";
    import { post, remove, patch } from "$lib/Web";
    import { userStore } from "$lib/stores";
    import Invite from "./Invite.svelte";

	type T = ChatRoom & GameRoom & any;

	export let room: T;

    const lock = `${icon_path}/lock.svg`;
	const crown = `${icon_path}/crown.svg`;
	const gamemode_icons = [
		`${icon_path}/pong-classic.svg`,
		`${icon_path}/vr.svg`,
		`${icon_path}/hexagon.svg`,
		`${icon_path}/hexagon4p.svg`,
	];
	
	const icon = gamemode_icons[room.gamemode as Gamemode];
	const route = room.type.replace("Room", "").toLowerCase();

	let password = "";
	
	$: user = $userStore.get($page.data.user?.id)!;

	async function join(room: T) {
		await unwrap(post(`/${route}/id/${room.id}/members`, { password }));

		password = "";
	}

	async function leave(room: T) {
		await unwrap(remove(`/${route}/id/${room.id}/members/me`));
	}
	
	async function erase(room: T) {
        await unwrap(remove(`/${route}/id/${room.id}`));
	}
	
	async function joinTeam(room: T, team: Team | null) {
		if (room.member?.player?.team?.id !== team?.id) {
			await unwrap(patch(`/${route}/id/${room.id}/team/${room.member?.id}`, { team: team?.id }));
		}

		await goto(`/${route}/${room.id}`);
	}

	function byId(first: Team, second: Team) {
		return first.id - second.id;
	}

</script>

<div class="room">
	<div class="room-name">
		{#if room.type === "ChatRoom"}
			<img class="avatar" src={room.owner.avatar} alt="avatar"/>
		{/if}
		<div>{room.name}</div>
		{#if room.type === "ChatRoom" && room.owner.id === user.id}
			<img class="owner-icon" src={crown} alt="crown"/>
		{/if}
		{#if room.type === "GameRoom"}
			<img class="icon" src={icon} alt="icon"/>
		{/if}
		{#if room.access === Access.PROTECTED}
			<img class="icon" src={lock} alt="lock"/>
		{/if}
	</div>
	<div class="grow"/>
	{#if room.joined}
		{#if room.owner.id === user.id}
			<Invite {room}/>
			<button class="button red" on:click={() => erase(room)}>Delete</button>
		{:else}
			<button class="button red" on:click={() => leave(room)}>Leave</button>
		{/if}
		{#if room.type !== "GameRoom" || room.teamsLocked}
			<a class="button blue" href={`/${route}/${room.id}`}>Enter</a>
		{:else}
			{#if !room.teamsLocked || room.member?.player === null}
				<button class="button blue" on:click={() => joinTeam(room, null)}>Spectate</button>
			{/if}
			{#if room.teams} 
				{#each room.teams.sort(byId) as team}
					{#if !room.teamsLocked || room.member?.player?.team.id === team.id}
						<button class="button blue" on:click={() => joinTeam(room, team)}>Join {team.name}</button>
					{/if}
				{/each}
			{/if}
		{/if}
	{:else}
		{#if room.access === Access.PROTECTED}
			<input class="input" placeholder="Password" type="password" bind:value={password}>
		{/if}
		<button class="button green" on:click={() => join(room)}>Join</button>
	{/if}
</div>

<style>

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
		display: flex;
		flex-direction: row;
		flex-grow: 1;
		font-size: 1.25em;
		align-items: center;
		gap: inherit;
		white-space: nowrap;
	}

	.icon {
		width: 25px;
		height: 25px;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		margin-left: 0.5rem;
		margin-top: 5px;
		align-self: center;
	}

	.owner-icon {
		width: 1.5rem;
		height: 1.5rem;
		-webkit-filter: var(--invert);
		filter: var(--invert);
	}

	.avatar {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 1px solid var(--border-color);
	}

	.button, .input {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
	}	
	
	.button {
		text-align: center;
		white-space: nowrap;
	}

	.red {
		border-color: var(--red);
	}

	.green {
		border-color: var(--green);
	}

	.blue {
		border-color: var(--blue);
	}

</style>