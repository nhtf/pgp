<script lang="ts">
	import { unwrap } from "$lib/Alert";
	import type { Member, Room, User } from "$lib/entities";
	import { get, post } from "$lib/Web";
	import { Avatar, Dropdown, DropdownItem } from "flowbite-svelte";
	import Swal from "sweetalert2";
	import { userStore } from "../../stores";

	export let room: Room;

	const url_type = room.type.replace("Room", "").toLowerCase();

	let members: Member[] = [];
	let invitee = "";
	let open = false;
	
	$: members;
	$: ids = members.map((member) => member.user.id);
	$: invitable = [...$userStore]
		.map(([id, user]) => user)
		.filter((user) => !ids.includes(user.id));
	$: matches = invitable.filter(match);

	async function invite(room: Room) {
		if (!invitee.length) {
			return Swal.fire({
				icon: "warning",
				text: "Please enter a username",
				timer: 3000,
			});
		}

		await unwrap(post(`/${url_type}/id/${room.id}/invite`, { username: invitee }));

		Swal.fire({ icon: "success", timer: 1000 });
	}

	function match(user: User) {
		return user.username.includes(invitee);
	}

	async function fetchMembers() {
		members = await unwrap(get(`/${url_type}/id/${room.id}/members`));
	}
</script>

<input
	class="input"
	placeholder="Username"
	bind:value={invitee}
	on:input={() => matches = invitable.filter(match)}
	on:focus|once={fetchMembers}
/>
<Dropdown bind:open={open}>
	{#each matches as { id, username, avatar } (id)}
		<DropdownItem on:click={() => { invitee = username; open = false; }} class="flex gap-1">
			<Avatar class="avatar" src={avatar} />
			<div>{username}</div>
		</DropdownItem>
	{/each}
</Dropdown>
<button class="button green" on:click={() => invite(room)}>Invite</button>

<style>
	.button,
	.input {
		display: inline-block;
		background: var(--box-color);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 2px 8px;
		margin: 0.25rem;
	}

	.button {
		width: 80px;
		text-align: center;
	}

	.green {
		border-color: var(--green);
	}
</style>
