<script lang="ts">
    import { page } from "$app/stores";
    import { unwrap } from "$lib/Alert";
    import { icon_path } from "$lib/constants";
	import { Access, Gamemode, type Room, type User } from "$lib/types";
    import { post, remove } from "$lib/Web";
    import Swal from "sweetalert2";

	type T = Room & {
		gamemode?: Gamemode,
	};

	export let room: T;

    const lock = `${icon_path}/lock.svg`;
	const crown = `${icon_path}/crown.svg`;
	const gamemode_icons = [
		`${icon_path}/pong-classic.svg`,
		`${icon_path}/vr.svg`,
		`${icon_path}/hexagon.svg`,
	];

	const icon = gamemode_icons[room.gamemode as Gamemode];
	const url_type = room.type.replace("Room", "").toLowerCase();

	let user: User;
	let invitee = "";
	let password = "";

	$: user = $page.data.user;
	
	async function join(room: T) {
		await unwrap(post(`/${url_type}/id/${room.id}/members`, { password }));

		password = "";
	}

	async function leave(room: T) {
		await unwrap(remove(`/${url_type}/id/${room.id}/members/me`));
	}
	
    async function invite(room: T) {
		if (!invitee.length) {
			return Swal.fire({
                icon: "warning",
                text: "Please enter a username",
				timer: 3000,
            });
		}

		await unwrap(post(`/${url_type}/id/${room.id}/invite`, { username: invitee }));
		
		Swal.fire({	icon: "success" });
    }

	async function erase(room: T) {
        await unwrap(remove(`/${url_type}/id/${room.id}`));
	}

</script>

<div class="room">
	<div class="room-name">
		{#if room.type === "ChatRoom"}
			<img class="avatar" src={room.owner.avatar} alt="avatar"/>
			<img class="owner-icon" src={crown} alt="crown"/>
		{/if}
		<div>{room.name}</div>
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
			<input class="input" placeholder="Username" bind:value={invitee}>
			<button class="button button-invite" on:click={() => invite(room)}>Invite</button>
		{/if}
		<a class="button button-enter" href={`/${url_type}/${room.id}`}>Enter</a>
		{#if room.owner.id === user.id}
			<button class="button button-delete" on:click={() => erase(room)}>Delete</button>
		{:else}
			<button class="button button-leave" on:click={() => leave(room)}>Leave</button>
		{/if}
	{:else}
		{#if room.access === Access.PROTECTED}
			<input class="input" placeholder="Password" type="password" bind:value={password}>
		{/if}
		<button class="button button-join" on:click={() => join(room)}>Join</button>
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

	.owner-icon {
		width: 20px;
		height: 20px;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		position: relative;
		bottom: 0.5rem;
		right: 0.5rem;
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
		width: 80px;
		text-align: center;
	}

	.button-join, .button-invite {
		border-color: var(--green);
	}

	.button-delete, .button-leave {
		border-color: var(--red);
	}

	.button-enter {
		border-color: var(--blue);
	}

</style>