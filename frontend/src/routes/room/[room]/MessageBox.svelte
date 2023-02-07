<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import { post } from "$lib/Web";
    import { Avatar, Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-svelte";
    import Swal from "sweetalert2";
	import { page } from "$app/stores";
    import { Role, type ChatRoom, type Member, type Message } from "$lib/types";

	export let message: Message;

	const room: ChatRoom = $page.data.room;
	const role: Role = $page.data.role;

	const user = message.member.user;

	const member_actions = [
		[],
		[ "ban", "mute" ],
		[ "demote", "promote" ],
	];

	const from_self = $page.data.user?.id == user?.id;
	const flex_direction = from_self ? "row-reverse" : "row";
	const align_self = from_self ? "flex-end" : "flex-start";
	const text_align = from_self ? "right" : "left";

	async function doAction(route: string, target: Member) {
		await unwrap(post(`/room/id/${room.id}/${route}`, { target: target.id }));

		Swal.fire({
			icon: "success",
		})
	}
	console.log(message);
</script>

<div class="message" style={`flex-direction: ${flex_direction}; align-self: ${align_self}`}>
	<Avatar src={user.avatar} title={user.username}/>
		<Dropdown>
			<DropdownHeader>
				{Role[message.member.role]}
			</DropdownHeader>
			<DropdownItem>
				<a href={`/profile/${user.username}`}>Profile</a>
			</DropdownItem>
			{#if user.id !== $page.data.user.id}
				{#each member_actions as actions, i}
					{#if role >= i}
						{#if i > 0}
							<DropdownDivider/>
						{/if}
						{#each actions as action}
							<DropdownItem on:click={() => doAction(action, message.member)}>{action}</DropdownItem>
						{/each}
					{/if}
				{/each}
			{/if}
		</Dropdown>
	<div class="message-box">
		<div class="text-sm underline" style={`text-align: ${text_align};`}>{user.username}</div>
		<div class="message-content">{message.content}</div>
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
		margin-top: 0.125rem;
		max-width: 100%;
		overflow-wrap: break-word;
	}

	.message-box {
		max-width: calc(100vw - 150px);
	}

	.message-content {
		white-space: pre-wrap;
		font-size: 1.125rem;
	}
</style>