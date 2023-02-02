<script lang="ts">
    import { unwrap } from "$lib/Alert";
	import { Role, type Member, type Message } from "$lib/types";
    import { post } from "$lib/Web";
    import { Avatar, Dropdown, DropdownDivider, DropdownItem } from "flowbite-svelte";
    import Swal from "sweetalert2";
	import {page} from "$app/stores";

	export let id: number;
	// export let member: Member;
	export let message: Message;

	let member = message.member;

	const admin_actions = [	"ban", "kick", "mute" ];
	const owner_actions = [ "demote", "promote" ];

	const flex_direction = $page.data.user?.id == message.user?.id ? "row-reverse" : "row";
	const align_self = $page.data.user?.id == message.user?.id ? "left" : "right";
	const user = member.user;

	async function doAction(route: string) {
		console.log(`/room/id/${id}/${route}`)
		await unwrap(post(`/room/id/${id}/${route}`, { owner: user.username }));

		Swal.fire({
			icon: "success",
		})
	}
	console.log("message: ", message);
</script>

<div class="message" style={`flex-direction: ${flex_direction}; align_self: ${align_self}`}>
	{#if member.user.username !== $page.data.user.username}
	<Dropdown triggeredBy=".acs">
		<DropdownItem on:click={() => { window.location.assign(`/profile/${user.username}`)}}>Profile</DropdownItem>
		{#if member.role >= Role.ADMIN}
		<DropdownDivider/>
				{#each admin_actions as action}
					<DropdownItem on:click={() => doAction(action)}>{action}</DropdownItem>
				{/each}
			{/if}
			{#if member.role >= Role.OWNER}
		<DropdownDivider/>
				{#each owner_actions as action}
					<DropdownItem on:click={() => doAction(action)}>{action}</DropdownItem>
				{/each}
			{/if}
	</Dropdown>
	{/if}
	<div class="message-box">
		<div class="text-sm underline text-right">{message.member.user.username} </div>
		<div class="message-content">{message.content}</div>
	</div>
	<div class="avatar">
		<Avatar class="acs" src={user.avatar} title={user.username}/>
		</div>
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
		max-width: 100%;
		overflow-wrap: break-word;
	}

	.avatar {
		width: 40px;
		height: 40px;
		font-size: smaller;
		position: relative;
		top: 0.25rem;
	}

	.message-box {
		max-width: calc(100vw - 150px);
	}

	.message-content {
		white-space: pre-wrap;
		font-size: 1.125rem;
	}
</style>