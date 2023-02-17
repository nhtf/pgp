<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import type { Member, Room, User } from "$lib/types";
    import { post } from "$lib/Web";
    import { Avatar, Dropdown, DropdownItem } from "flowbite-svelte";
    import { onMount } from "svelte";
    import Swal from "sweetalert2";

	export let room: Room;
	export let members: Member[];
	export let users: User[];

	const ids = members.map((member) => member.user.id);
	const url_type = room.type.replace("Room", "").toLowerCase();

	$: invitee = "";
	$: invitable = users!.filter((user) => !ids.includes(user.id));
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
		
		Swal.fire({	icon: "success" });
    }

	function updateInput() {
		matches = invitable.filter(match)
	}

	function match(user: User) {
		return user.username.includes(invitee);
	}

</script>

<input class="input" placeholder="Username" bind:value={invitee} on:input={updateInput}>
<Dropdown>
	{#each matches as { username, avatar }}
		<DropdownItem class="flex gap">
			<Avatar class="avatar" src={avatar}/>
			<div>{username}</div>
		</DropdownItem>
	{/each}
</Dropdown>
<button class="button green" on:click={() => invite(room)}>Invite</button>

<style>

	.button, .input {
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