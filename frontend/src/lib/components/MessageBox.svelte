<script lang="ts">
    import type { User, ChatRoom, Member, Message } from "$lib/entities";
	import { BOUNCER } from "$lib/constants";
    import { unwrap } from "$lib/Alert";
    import { patch, post, remove } from "$lib/Web";
    import { Avatar, Dropdown, DropdownDivider, DropdownItem } from "flowbite-svelte";
	import { page } from "$app/stores";
	import { CoalitionColors, Role } from "$lib/enums";
    import Swal from "sweetalert2";
    import { memberStore, userStore } from "../../stores"

	export let message: Message;
	export let self: Member;

	const tenor_regex = /^https:\/\/media\.tenor\.com\/([^\/]+\/[^\/]+\.gif)$/;
	const status_colors = [ "gray", "yellow", "green" ];
	const role_colors = Object.values(CoalitionColors);

	const room: ChatRoom = $page.data.room;
	const me: User = $page.data.user;

	let member = message.member;
	let user = member.user;

	$: member = $memberStore.get(member.id)!;
	$: user = $userStore.get(user.id)!;

	const from_self = me.id === user.id;
	const flex_direction = from_self ? "row-reverse" : "row";
	const align_self = from_self ? "flex-end" : "flex-start";
	const text_align = from_self ? "right" : "left";

	async function edit(target: Member, role: Role) {
		await unwrap(patch(`/chat/id/${room.id}/members/${target.id}`, { role }));
	}

	async function kick(target: Member, ban: boolean) {
		await unwrap(remove(`/chat/id/${room.id}/members/${target.id}`, { ban }));

		Swal.fire({
			icon: "success",
			timer: 3000,
		});
	}

	async function mute(target: Member, minutes: number) {
		const millis = minutes * 60 * 1000;

		await unwrap(post(`/chat/id/${room.id}/mute/${target.id}`, { duration: millis }));
	
		Swal.fire({
			icon: "success",
			timer: 3000,
		});
	}

	message.embeds = message.embeds || [];
</script>

<div class="message" style={`flex-direction: ${flex_direction}; align-self: ${align_self}`}>
	<Avatar
		src={user.avatar}
		title={user.username}
		dot={{
			placement: "bottom-right",
			color: status_colors[user.status],
		}}
		/>
		<Dropdown>
			<DropdownItem>
				<a href={`/profile/${user.username}`}>Profile</a>
			</DropdownItem>
			{#if user.id !== $page.data.user.id}
				{#if self.role >= Role.OWNER && member.role < Role.OWNER}
					<DropdownDivider/>
					<DropdownItem on:click={() => edit(member, member.role + 1)}>Promote</DropdownItem>
					{#if message.member.role > 0}
						<DropdownItem on:click={() => edit(member, member.role - 1)}>Demote</DropdownItem>
					{/if}
				{/if}
				{#if self.role >= Role.ADMIN && member.role < self.role}
					<DropdownDivider/>
					<DropdownItem on:click={() => kick(member, true)}>Ban</DropdownItem>
					<DropdownItem on:click={() => kick(member, false)}>Kick</DropdownItem>
					{#if member.is_muted}
						<DropdownItem on:click={() => mute(member, 0)}>Unmute</DropdownItem>
					{:else}
						<DropdownItem on:click={() => mute(member, 1)}>Mute</DropdownItem>
					{/if}
				{/if}
			{/if}
		</Dropdown>
	<div class="message-box">
		<div class="text-sm underline" style={`text-align: ${text_align}; color: #${role_colors[member.role]}`}>{user.username}</div>
		<!--- TODO probably extremely unsafe
		{#if tenor_regex.test(message.content)}
			<img class="message-image" src={`${BACKEND}/proxy?url=${message.content}`} alt="embedded content">
		{:else}
			<div class="message-content">{message.content}</div>
			{/if} -->
		<div class="message-content">{message.content}</div>
		{#each message.embeds as embed}
		<img class="message-image" src={`${BOUNCER}/${embed.digest}/proxy?${new URLSearchParams({ url: embed.url })}`} alt="embed">
		{/each}
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
		gap: 1em;
	}

	.message-content {
		white-space: pre-wrap;
		font-size: 1.125rem;
	}

	.message-image {
		max-width: 10rem;
		max-height: 10rem;
		margin: 0.25rem;
	}

</style>
