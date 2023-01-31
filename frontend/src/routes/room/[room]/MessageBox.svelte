<script lang="ts">
    import { unwrap } from "$lib/Alert";
	import { Role, type Member, type Message } from "$lib/types";
    import { post } from "$lib/Web";
    import { Avatar, Dropdown, DropdownDivider, DropdownItem } from "flowbite-svelte";
    import Swal from "sweetalert2";

	export let id: number;
	export let member: Member;
	export let message: Message;

	const admin_actions = [	"ban", "kick", "mute" ];
	const owner_actions = [ "demote", "promote" ];

	const flex_direction = member.id == message.member.id ? "row-reverse" : "row";
	const user = member.user;

	async function doAction(route: string) {
		console.log(`/room/id/${id}/${route}`)
		await unwrap(post(`/room/id/${id}/${route}`, { owner: user.username }));

		Swal.fire({
			icon: "success",
		})
	}
</script>

<div class="message" style={`flex-direction: ${flex_direction}`}>
	<Avatar class="acs" src={user.avatar}/>
	<Dropdown triggeredBy=".acs">
		<DropdownItem on:click={() => { window.location.assign(`/profile/${user.username}`)}}>Profile</DropdownItem>
		<DropdownDivider/>
			{#if member.role >= Role.ADMIN}
				{#each admin_actions as action}
					<DropdownItem on:click={() => doAction(action)}>{action}</DropdownItem>
				{/each}
			{/if}
		<DropdownDivider/>
			{#if member.role >= Role.OWNER}
				{#each owner_actions as action}
					<DropdownItem on:click={() => doAction(action)}>{action}</DropdownItem>
				{/each}
			{/if}
	</Dropdown>
	<div>{message.content}</div>
</div>

<!-- <div class="message" style={`flex-direction: ${flex_direction}`}>
	<img src={message.user.avatar} alt="">
</div> -->

<style>
	.message {
		display: flex;
		font-size: 2em;
		gap: 1em;
		margin: 1em;
		color: var(--text-color);
	}

	input {
		color: var(--text-color);
	}
</style>