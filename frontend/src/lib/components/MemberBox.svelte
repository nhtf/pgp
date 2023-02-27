<script lang="ts">
	import { unwrap } from "$lib/Alert";
	import { status_colors } from "$lib/constants";
	import type { Member } from "$lib/entities";
	import { Role } from "$lib/enums";
	import { patch, post, remove } from "$lib/Web";
	import {
		Avatar,
		Dropdown,
		DropdownDivider,
		DropdownItem,
	} from "flowbite-svelte";
	import Swal from "sweetalert2";
	import { userStore } from "../../stores";

	export let target: Member;
	export let self: Member;

	// minutes
	const mute_duration = 1;

	type Action = {
		role: Role;
		condition?: (target: Member) => boolean;
		param: ((target: Member) => any) | any;
		fun: Function;
		name: string;
	};

	$: user = $userStore.get(target.userId)!;

	async function edit(target: Member, role: Role) {
		await unwrap(
			patch(`/chat/id/${target.roomId}/members/${target.id}`, { role })
		);
	}

	async function kick(target: Member, ban: boolean) {
		await unwrap(
			remove(`/chat/id/${target.roomId}/members/${target.id}`, { ban })
		);

		Swal.fire({
			icon: "success",
			timer: 3000,
		});
	}

	async function mute(target: Member, minutes: number) {
		const millis = minutes * 60 * 1000;

		await unwrap(
			post(`/chat/id/${target.roomId}/mute/${target.id}`, {
				duration: millis,
			})
		);

		Swal.fire({
			icon: "success",
			timer: 3000,
		});
	}

	const actions: Action[] = [
		{
			role: Role.OWNER,
			fun: edit,
			param: (target: Member) => target.role + 1,
			name: "Promote",
		},
		{
			role: Role.OWNER,
			condition: (target: Member) => target.role >= 1,
			fun: edit,
			param: (target: Member) => target.role - 1,
			name: "Demote",
		},
		{
			role: Role.ADMIN,
			param: false,
			fun: kick,
			name: "Kick",
		},
		{
			role: Role.ADMIN,
			param: true,
			fun: kick,
			name: "Ban",
		},
		{
			role: Role.ADMIN,
			condition: (target: Member) => !target.is_muted,
			param: mute_duration,
			fun: mute,
			name: "Mute",
		},
		{
			role: Role.ADMIN,
			condition: (target: Member) => target.is_muted,
			param: 0,
			fun: mute,
			name: "Unmute",
		},
	];
</script>

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
	{#if self.id !== target.id}
		{#each Object.values(Role)
			.reverse()
			.filter((role) => typeof role === "number" && role > 0) as role}
			{#if self.role >= role && target.role < self.role}
				<DropdownDivider />
				{#each actions.filter((action) => action.role === role) as { condition, fun, param, name }}
					{#if !condition || condition(target)}
						<DropdownItem
							on:click={() =>
								fun(
									target,
									typeof param === "function"
										? param(target)
										: param
								)}>{name}</DropdownItem
						>
					{/if}
				{/each}
			{/if}
		{/each}
	{/if}
</Dropdown>
