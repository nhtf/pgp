<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import { patch, post, remove } from "$lib/Web";
    import { Avatar, Dropdown, DropdownDivider, DropdownItem } from "flowbite-svelte";
    import Swal from "sweetalert2";
	import { page } from "$app/stores";
    import type { User, ChatRoom, Member, Message } from "$lib/types";
	import { CoalitionColors, Role, Status } from "$lib/enums";
    import isURL from "validator/lib/isURL";
    import { BACKEND } from "$lib/constants";

	export let message: Message;
	export let my_role: Role;

	type Word = {
		value: string,
		link: boolean,
	}

	const tenor_regex = /^https:\/\/media\.tenor\.com\/([^\/]+\/[^\/]+\.gif)$/;
	const status_colors = [ "gray", "yellow", "green" ];
	const role_colors = Object.values(CoalitionColors);

	const room: ChatRoom = $page.data.room;
	const me: User = $page.data.user;
	const member = message.member;
	const user = member.user;

	const from_self = me.id === user.id;
	const flex_direction = from_self ? "row-reverse" : "row";
	const align_self = from_self ? "flex-end" : "flex-start";
	const text_align = from_self ? "right" : "left";

	let words: Word[] = splitIfLink(message.content);

	async function edit(target: Member, role: Role) {
		await unwrap(patch(`/chat/id/${room.id}/members/${target.id}`, { role }));
	}

	async function kick(target: Member, ban: boolean) {
		await unwrap(remove(`/chat/id/${room.id}/members/${target.id}`, { ban }));

		Swal.fire({
			icon: "success",
		});
	}

	async function mute(target: Member, minutes: number) {
		const millis = minutes * 60 * 1000;

		await unwrap(post(`/chat/id/${room.id}/mute/${target.id}`, { duration: millis }));
	
		Swal.fire({
			icon: "success",
		});
	}

	function splitIfLink(value: string) {
		const split = message.content.split(/\s/);
		const containsLink = split.some((word) => isURL(word));
		let words: Word[] = [];

		if (containsLink) {
			words = split.map((value) => { return { value, link: isURL(value) } });
		}

		return words;
	}

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
				{#if my_role >= Role.OWNER && member.role < Role.OWNER}
					<DropdownDivider/>
					<DropdownItem on:click={() => edit(member, member.role + 1)}>Promote</DropdownItem>
					{#if message.member.role > 0}
						<DropdownItem on:click={() => edit(member, member.role - 1)}>Demote</DropdownItem>
					{/if}
				{/if}
				{#if my_role >= Role.ADMIN && member.role < my_role}
					<DropdownDivider/>
					<DropdownItem on:click={() => kick(member, true)}>Ban</DropdownItem>
					<DropdownItem on:click={() => kick(member, false)}>Kick</DropdownItem>
					<DropdownItem on:click={() => mute(member, 1)}>Mute</DropdownItem>
					{#if member.is_muted}
						<DropdownItem on:click={() => mute(member, 0)}>Unmute</DropdownItem>
					{/if}
				{/if}
			{/if}
		</Dropdown>
	<div class="message-box">
		<div class="text-sm underline" style={`text-align: ${text_align}; color: #${role_colors[member.role]}`}>{user.username}</div>
		<!--- TODO probably extremely unsafe -->
		{#if tenor_regex.test(message.content)}
			<img class="message-image" src={`${BACKEND}/proxy?url=${message.content}`} alt="embedded content">
		{:else}
			<div class="message-content">{message.content}</div>
		{/if}
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
