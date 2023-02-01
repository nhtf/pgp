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

	const flex_direction = member?.id == message.member?.id ? "row-reverse" : "row";
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
	<div class="max-w-full">{message.content}</div>
</div>

<style>
	.message {
		display: flex;
		font-size: 1.5rem;
		gap: 1em;
		background-color: var(--box-color);
		width: max-content;
		color: var(--text-color);
		border-radius: 6px;
		padding: 0.5rem;
		align-self: flex-end;
		margin-top: 0.125rem;
	}
</style>