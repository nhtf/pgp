<script lang="ts">
	import type { PageData } from "./$types";
	import { memberStore, roomStore, updateStore } from "$lib/stores";
	import { User, ChatRoom, ChatRoomMember } from "$lib/entities";
	import { unwrap } from "$lib/Alert";
	import { Role } from "$lib/enums";
	import { patch } from "$lib/Web";
    import UserDropdown from "$lib/components/UserDropdown.svelte";
    import RoomHeader from "$lib/components/RoomHeader.svelte";
	import RoomInput from "$lib/components/RoomInput.svelte";
	import Invite from "$lib/components/InviteBox.svelte";

	export let data: PageData;

	updateStore(User, data.banned);
	updateStore(ChatRoom, data.room);

	if (data.room.self) {
		updateStore(ChatRoomMember, data.room.self);
	}

	$: room = $roomStore.get(data.room.id)!;
	$: self = $memberStore.get(room?.self!.id)!;
	$: banned = data.banned;

	async function edit(edit: any, room: ChatRoom) {
		edit.name = edit.name.length ? edit.name : null;
		edit.password = edit.password.length ? edit.password : null;

		await unwrap(patch(room.route, edit));
	}

</script>

{#if room}
	<div class="m-2">
		<RoomHeader {room}/>
	</div>
	<div class="room-settings">
		<div class="box">
			<Invite {room} />
		</div>
		{#if self && self.role >= Role.OWNER}
			<RoomInput {room} click={edit} buttonText={"edit"} />
		{/if}

		<div class="box">
			<h1>Banned Users</h1>
			<div class="banned">
				{#each banned as user}
					<UserDropdown {user} {room} banned={true}/>
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
