<script lang="ts">
	import type { Member, Room, User } from "$lib/entities";
	import { Avatar, Dropdown, DropdownItem } from "flowbite-svelte";
	import { page } from "$app/stores";
	import { unwrap } from "$lib/Alert";
	import { get, post } from "$lib/Web";
	import { userStore } from "$lib/stores";
	import Swal from "sweetalert2";

	export let room: Room;

	const route = room.type.replace("Room", "").toLowerCase();

	let members: Member[] = [];
	let invitee = "";
	let open = false;

	$: me = $userStore.get($page.data.user?.id)!;
	$: friends = [...$userStore]
		.map(([_, user]) => user)
		.filter((user) => me.friendsIds.includes(user.id));
	$: member_user_ids = members.map((member) => member.userId);
	$: invitable = friends.filter((user) => !member_user_ids.includes(user.id));
	$: matches = invitable.filter(match);

	async function invite(room: Room) {
		if (!invitee.length) {
			return Swal.fire({
				icon: "warning",
				text: "Please select a user",
				timer: 3000,
			});
		}

		await unwrap(
			post(`/${route}/id/${room.id}/invite`, { username: invitee })
		);

		Swal.fire({ icon: "success", timer: 1000 });
	}

	function match(user: User) {
		return user.username.includes(invitee);
	}

	async function fetchMembers() {
		members = await unwrap(get(`/${route}/id/${room.id}/members`));
	}
</script>

<div class="invite">
	<input
		class="input"
		placeholder="Username"
		bind:value={invitee}
		on:input={() => (matches = invitable.filter(match))}
		on:focus|once={fetchMembers}
	/>
	{#if matches.length}
		<Dropdown bind:open>
			{#each matches as { id, username, avatar } (id)}
				<DropdownItem
					on:click={() => {
						invitee = username;
						open = false;
					}}
					class="flex gap-1"
				>
					<Avatar class="avatar" src={avatar} />
					<div>{username}</div>
				</DropdownItem>
			{/each}
		</Dropdown>
	{/if}
	<button class="button border-green" on:click={() => invite(room)}>Invite</button>
</div>

<style>
	.invite {
		display: flex;
		column-gap: 0.25rem;
	}

</style>
