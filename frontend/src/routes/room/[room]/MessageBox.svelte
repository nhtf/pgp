<script lang="ts">
    import { unwrap } from "$lib/Alert";
    import { patch, post, remove } from "$lib/Web";
    import { Avatar, Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-svelte";
    import Swal from "sweetalert2";
	import { page } from "$app/stores";
    import { CoalitionColors, Role, type ChatRoom, type Member, type Message } from "$lib/types";

	export let message: Message;

	const status_colors = [ "gray", "yellow", "green" ];
	const role_colors = Object.values(CoalitionColors);

	const room: ChatRoom = $page.data.room;
	const my_role: Role = $page.data.role;
	const member = message.member;
	const user = member.user;

	const from_self = $page.data.user?.id == user.id;
	const flex_direction = from_self ? "row-reverse" : "row";
	const align_self = from_self ? "flex-end" : "flex-start";
	const text_align = from_self ? "right" : "left";

	async function edit(target: Member, role: Role) {
		await unwrap(patch(`/room/id/${room.id}/members/${target.id}`, { role }));

		Swal.fire({
			icon: "success",
		});
	}

	async function kick(target: Member, ban: boolean) {
		await unwrap(remove(`/room/id/${room.id}/members/${target.id}`, { ban }));

		Swal.fire({
			icon: "success",
		});
	}

	async function mute(target: Member, minutes: number) {
		const millis = minutes * 60 * 1000;

		await unwrap(post(`/room/id/${room.id}/mute/${target.id}`, { duration: millis }));
	
		Swal.fire({
			icon: "success",
		});
	}

</script>

<div class="message" style={`flex-direction: ${flex_direction}; align-self: ${align_self}`}>
	<Avatar
		src={user.avatar}
		title={user.username}
		dot={{
			placement: "bottom-right",
			color: status_colors[user.status],
			// TODO: update status
		}}
		/>
		<Dropdown>
			<DropdownHeader>
				<div class="text-sm">{Role[member.role]}</div>
			</DropdownHeader>
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
					<DropdownItem on:click={() => mute(member, 10)}>Mute</DropdownItem>
					<DropdownItem on:click={() => kick(member, false)}>Kick</DropdownItem>
					<DropdownItem on:click={() => kick(member, true)}>Ban</DropdownItem>
					{#if member.is_muted}
						<DropdownItem on:click={() => mute(member, 0)}>Unmute</DropdownItem>
					{/if}
				{/if}
			{/if}
		</Dropdown>
	<div class="message-box">
		<div class="text-sm underline" style={`text-align: ${text_align}; color: #${role_colors[member.role]}`}>{user.username}</div>
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
