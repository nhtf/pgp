<script lang="ts">
	import type { Member, User } from "$lib/entities";
	import { unwrap } from "$lib/Alert";
	import { status_colors } from "$lib/constants";
	import { Role, roles, Gamemode } from "$lib/enums";
	import { blockStore, userStore } from "$lib/stores";
	import { patch, post, remove } from "$lib/Web";
	import { page } from "$app/stores";
	import { Avatar, Dropdown, DropdownDivider, DropdownItem, Tooltip } from "flowbite-svelte";
	import Swal from "sweetalert2";
    import { goto } from "$app/navigation";

	export let member: Member | null;
	export let user: User = $userStore.get(member!.userId)!;
	export let self: Member;
	export let memberGroup: boolean;

	type Action = {
		role: Role;
		condition?: (member: Member) => boolean;
		param?: ((member: Member) => any) | any;
		fun: Function;
		name: string;
	};

	// minutes
	const mute_duration = 1;
	const options = [ "Classic", "Modern","VR" ];

	$: me = $userStore.get($page.data.user?.id)!;
	$: user = $userStore.get(user!.id)!;
	$: blockedIds = [...$blockStore.keys()];

	async function edit(member: Member, role: Role) {
		await unwrap(
			patch(`/chat/id/${member.roomId}/members/${member.id}`, { role })
		);
	}

	async function kick(member: Member, ban: boolean) {
		await unwrap(
			remove(`/chat/id/${member.roomId}/members/${member.id}`, { ban })
		);

		Swal.fire({ icon: "success", timer: 3000 });
	}

	async function mute(member: Member, minutes: number) {
		const millis = minutes * 60 * 1000;

		await unwrap(
			post(`/chat/id/${member.roomId}/mute/${member.id}`, {
				duration: millis,
			})
		);

		Swal.fire({ icon: "success", timer: 3000 });
	}

	async function block(user: User) {
		await unwrap(post(`/user/me/block/${user.id}`));

		Swal.fire({ icon: "success", timer: 3000 });
	}

	async function unblock(user: User) {
		await unwrap(remove(`/user/me/unblock/${user.id}`));
	
		Swal.fire({ icon: "success", timer: 3000 });
	}

	async function invite(user: User) {
		const { value } = await Swal.fire({
			title: "Invite to match",
			input: "radio",
			inputOptions: options,
			color: "var(--text-color)",
			confirmButtonText: "Invite",
			confirmButtonColor: "var(--confirm-color)",
			cancelButtonColor: "var(--cancel-color)",
			background: "var(--box-color)",
		});

		const roomDto = {
			name: null,
			password: null,
			is_private: true,
			gamemode: Number(value),
			players: 2,
		};

		const room = await unwrap(post(`/game`, roomDto));
	
		await unwrap(post(`/game/id/${room.id}/invite`, { username: user.username }));
		// TODO: join team
		await goto(`/game/${room.id}`);
	}

	const actions: Action[] = [
		{
			role: Role.OWNER,
			fun: edit,
			param: (member: Member) => member.role + 1,
			name: "Promote",
		},
		{
			role: Role.OWNER,
			condition: (member: Member) => member.role >= 1,
			fun: edit,
			param: (member: Member) => member.role - 1,
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
			condition: (member: Member) => !member.is_muted,
			param: mute_duration,
			fun: mute,
			name: "Mute",
		},
		{
			role: Role.ADMIN,
			condition: (member: Member) => member.is_muted,
			param: 0,
			fun: mute,
			name: "Unmute",
		},
	];
</script>

<Avatar
	src={user.avatar}
	id="avatar-{user.username}box{memberGroup}"
	dot={{
		placement: "bottom-right",
		color: status_colors[user.status],
	}}
	class="bg-c"
/>
<Tooltip triggeredBy="#avatar-{user.username}box{memberGroup}"
	>{user.username}</Tooltip
>
<!-- //TODO dropdown menu placement is wrong if message is at the bottom (or membergroup at the bottom) -->
<Dropdown
	triggeredBy="#avatar-{user.username}box{memberGroup}"
	class="bor-c bg-c shadow rounded max-w-sm"
>
	<DropdownItem href={`/profile/${user.username}`}>Profile</DropdownItem>
	<DropdownDivider/>
	{#if me.id !== user.id}
		{#each roles as role}
			{#if self.role >= role && member && member.role < self.role}
				{#each actions.filter((action) => action.role === role) as { condition, fun, param, name }}
					{#if !condition || condition(member)}
						<DropdownItem
							on:click={() =>
								fun(
									member,
									typeof param === "function"
										? param(member)
										: param
								)}>{name}</DropdownItem
						>
					{/if}
				{/each}
			{/if}
		{/each}
		{#if !blockedIds.includes(user.id)}
			<DropdownItem on:click={() => block(user)}>Block</DropdownItem>
		{:else}
			<DropdownItem on:click={() => unblock(user)}>Unblock</DropdownItem>
		{/if}
		<DropdownItem on:click={() => invite(user)}>Invite</DropdownItem>
	{/if}
</Dropdown>
