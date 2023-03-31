<script lang="ts">
	import type { Room, User } from "$lib/entities";
	import type { PageData } from "./$types";
	import { memberStore, roomStore } from "$lib/stores";
	import { patch, remove } from "$lib/Web";
	import { goto } from "$app/navigation";
	import { unwrap } from "$lib/Alert";
	import { Role } from "$lib/enums";
	import {
		Dropdown,
		Avatar,
		Tooltip,
		DropdownHeader,
		DropdownItem,
	} from "flowbite-svelte";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import Invite from "$lib/components/Invite.svelte";
    import Swal from "sweetalert2";
    import RoomHeader from "$lib/components/RoomHeader.svelte";
    import UserDropdown from "$lib/components/UserDropdown.svelte";

	export let data: PageData;

	$: room = $roomStore.get(data.room.id)!;
	$: { !room && goto(`/chat`) }
	$: self = $memberStore.get(data.member.id)!;
	$: banned = data.banned;

	async function edit(edit: any, room: Room) {
		edit.name = edit.name.length ? edit.name : null;
		edit.password = edit.password.length ? edit.password : null;

		await unwrap(patch(room.route, edit));
	}

	async function erase(room: Room) {
		await unwrap(remove(room.route));
		await goto(`/chat`);
	}

</script>

{#if room}
	<RoomHeader {room}/>
	<div class="room-settings">
		<div class="box">
			<Invite {room} />
		</div>
		{#if self.role >= Role.OWNER}
			<RoomInput {room} click={edit} />
			<button class="button border-red" on:click={() => erase(room)}>Delete</button>
		{/if}

		<div class="box">
			<h1>Banned Users</h1>
			<div class="banned">
				{#each banned as user}
					<UserDropdown {user}/>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.room-settings {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		margin: 0.5rem;
		gap: 0.5rem;
	}

	.box {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		background: var(--box-color);
		border: 1px var(--border-color);
		border-radius: 0.375rem;
		padding: 0.5rem;
		margin-top: 0.25rem;
		column-gap: 0.5rem;
	}

	h1 {
		margin-bottom: 0.5rem;
	}

	.banned {
		display: flex;
		flex-direction: row-reverse;
		gap: 1rem;
	}
</style>
