<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { unwrap } from "$lib/Alert";
	import { Access, type ChatRoom, type User } from "$lib/types";
    import { post, remove } from "$lib/Web";
    import Swal from "sweetalert2";
	
	export let room: ChatRoom;

    const lock = "/Assets/icons/lock.svg";
	const user: User = $page.data.user;
	
	let invitee = "";

	// let frameclass = divider ? "room divider" : "room";
	let frameclass = "room";

	async function join(room: ChatRoom) {
		let body: { name?: string, password?: string } = {};
	
		if (room.access == Access.PROTECTED) {
			const { value: password, isDismissed } = await Swal.fire({
				text: "password",
				input: "password",
				inputPlaceholder: "password...",
			});

			if (isDismissed) {
				return ;
			}

			body.password = password;
		}

		await unwrap(post(`/room/id/${room.id}/members`, body));
	}
	
	async function leave(room: ChatRoom) {
		await unwrap(remove(`/room/id/${room.id}/leave`));
	}
	
    async function invite(room: ChatRoom) {
		if (!invitee.length) {
			return Swal.fire({
                icon: "warning",
                text: "Please enter a username",
				timer: 3000,
            });
		}

		await unwrap(post(`/room/id/${room.id}/invite`, { username: invitee }));
		
		Swal.fire({	icon: "success" });
    }

	async function deleteRoom(room: ChatRoom) {
        await unwrap(remove(`/room/id/${room.id}`));
	}

</script>

<div class={frameclass}>
	<div class="room-icon-block">
		<img class="room-icon" src={room.owner?.avatar} alt=""/>
		{#if room.owner.id === user.id}
			<div class="owner-icon"><img src="/Assets/icons/crown.svg" alt="crown"></div>
		{/if}
	</div>

	<!-- //TODO maybe other way to make it obvious that you are not a member or are? -->
	<div class={`room-name ${room.joined ? "" : "joinable"}`}>{room.name}</div>

	{#if room.access == Access.PROTECTED}
		<img class="lock-icon" src={lock} alt="lock">
	{/if}

	<div class="grow"/>

	<!-- TODO: fix font size -->
	{#if room.joined}
		{#if room.owner.id === user.id}
			<input class="input" placeholder="Username" bind:value={invitee}>
			<button class="button button-invite" on:click={() => invite(room)}>Invite</button>
		{/if}
		<a class="button button-enter" href={`/room/${room.id}`}>Enter</a>
		{#if room.owner.id === user.id}
			<button class="button button-delete" on:click={() => deleteRoom(room)}>Delete</button>
		{:else}
			<button class="button button-leave" on:click={() => leave(room)}>Leave</button>
		{/if}
	{:else}
		<button class="button button-join" on:click={() => join(room)}>Join</button>
	{/if}
</div>

<style>

	.joinable {
		color: var(--text-disabled-color);
	}

	.room {
		display: flex;
		background-color:var(--box-color);
		border-radius: 6px;
		display: flex;
		font-size: 1.5em;
		column-gap: 1rem;
		padding: 0.875rem;
		align-items: center;
		flex-direction: row;
		width: 100%;
		
	}

	.divider {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-bottom-color: var(--border-color)!important;
		border-bottom-width: 2px;
	}

	.room-name {
		font-size: 1.25rem;
		width: max-content;
		margin-left: 0.5rem;
	}

	.room-icon-block {
		width: 70px;
		display: flex;
		flex-direction: row;
	}

	.room:hover {
		background-color: var(--box-hover-color);
	}

	.lock-icon {
		width: 30px;
		height: 30px;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		position: relative;
	}

	.room-icon {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 1px solid var(--border-color);
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

	.label {
		line-height: 30px;
	}

	.button {
		width: 80px;
		text-align: center;
	}

	.button, .input, .select {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
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