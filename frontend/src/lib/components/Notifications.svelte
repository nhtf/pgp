<script lang="ts">
	import type { Invite } from "$lib/entities";
	import { Dropdown, DropdownItem, Avatar } from "flowbite-svelte";
	import { page } from "$app/stores";
	import { respond } from "$lib/invites";
	import { backIn as anim } from "svelte/easing";
	import { inviteStore, userStore } from "$lib/stores";
	import { onMount } from "svelte";

	enum Status {
		UNREAD,
		READ,
		REMOVED,
	}

	const notificationSound = new Audio("/Assets/sounds/notification.mp3");

	let notifMap = new Map<Invite, Status>();
	let oldLength: number;

	// console.log("A", $inviteStore.unMap());	

	$: user = $userStore.get($page.data.user?.id)!;
	$: invites = [...$inviteStore].map(([_, invite]) => invite);
	$: notifications = invites.filter((invite) => invite.to.id === user.id);
	$: notifMap = new Map(
		notifications.map((invite) => [
			invite,
			notifMap.has(invite) ? notifMap.get(invite)! : Status.UNREAD,
		])
	);
	$: newNotifs = [...notifMap.values()].some(
		(status) => status === Status.UNREAD
	);
	$: newlength = [...notifMap.values()].filter(
		(status) => status === Status.UNREAD
	).length;

	async function acceptInvite(invite: Invite) {
		mark(invite, Status.REMOVED);
		respond(invite, "accept");
	}

	function markAllRead() {
		notifMap = new Map(
			[...notifMap].map(([invite, status]) => [
				invite,
				status !== Status.REMOVED ? Status.READ : status,
			])
		);
	}

	function mark(key: Invite, status: Status) {
		notifMap = notifMap.set(key, status);
		newlength = [...notifMap.values()].filter(
			(status) => status === Status.UNREAD
			).length;
		if (status === Status.UNREAD)
			oldLength = newlength;
	}

	function spin(node: any, { duration }: { duration: number }) {
		return {
			duration,
			css: (t: number) => {
				const rot_eased = Math.sin(t * 4 * 2 * Math.PI);
				const scal_eased = anim(t) + 0.5;
				if (!newNotifs || oldLength >= newlength) {
					oldLength = newlength;
					return "";
				}
				notificationSound.play();
				oldLength = newlength;
				return `transform: rotate(${rot_eased * 45}deg);`;
			},
		};
	}

	onMount(() => {
		oldLength = [...notifMap.values()].filter(
			(status) => status === Status.UNREAD
		).length;
	});
</script>

<div id="bell" class="bell">
	{#key notifMap}
		<img
			src="/Assets/icons/bell.svg"
			class="bell-icon"
			alt="bell"
			id="bell-img"
			in:spin={{ duration: 1000 }}
		/>
	{/key}
	<div class="flex relative">
		{#if newNotifs}
			<div class="new-notifications" />
		{/if}
	</div>
</div>
<Dropdown
	triggeredBy="#bell"
	class="w-full max-w-sm rounded bor-c shadow bg-c"
	frameClass="bor-c shadow divide-y w-full max-w-sm"
	placement="bottom"
>
	<div slot="header" class="text-center py-2 font-bold text-center ">
		Notifications
	</div>
	{#each [...notifMap] as [invite, status] (invite.id)}
		<DropdownItem class="flex space-x-4 status{status} items-center border-b divide-gray-100">
			{#if status !== Status.REMOVED}
				<Avatar src={invite.from.avatar} />
				<div class="pl-3 w-full !ml-0 !mr-0 py-2">
					{invite.from.username}
					{#if invite.type === "Friend"}
					<div
						class="text-gray-500 text-sm dark:text-gray-400"
					>
						wants to be your friend
					</div>
					{:else if invite.type === "ChatRoom"}
					<div
						class="text-gray-500 text-sm dark:text-gray-400"
					>
						invites you to chat in 
					</div>{invite.room?.name}
					{:else}
					<div
						class="text-gray-500 text-sm dark:text-gray-400"
					>
						invites you to game in
					</div> {invite.room?.name}
					{/if}
				</div>
				<div class="flex flex-row justify-between items-center self-center gap-x-2">
					<div
						class="block text-xs text-blue-600 dark:text-blue-500 accept"
						on:click={() => acceptInvite(invite)}
						on:keypress={() => acceptInvite(invite)}
					>
						accept invite
					</div>
					{#if status === Status.UNREAD}
						<div
							class="flex text-xs text-blue-600 dark:text-blue-500 accept"
							on:click={() => mark(invite, Status.READ)}
							on:keypress={() => mark(invite, Status.READ)}
						>
							mark read
						</div>
					{:else}
						<div
							class="flex text-xs text-blue-600 dark:text-blue-500 accept"
							on:click={() => mark(invite, Status.UNREAD)}
							on:keypress={() => mark(invite, Status.UNREAD)}
						>
							mark unread
						</div>
					{/if}
				</div>
				<div class="close-button" title="remove notification">
					<svg
						fill="currentColor"
						width="20"
						height="20"
						on:click={() => mark(invite, Status.REMOVED)}
						on:keypress={() => mark(invite, Status.REMOVED)}
					>
						<path
							d="M13.42 12L20 18.58 18.58 20 12 13.42
					  5.42 20 4 18.58 10.58 12 4 5.42 5.42
					  4 12 10.58 18.58 4 20 5.42z"
						/>
					</svg>
				</div>
			{/if}
		</DropdownItem>
	{/each}
	{#if newNotifs}
		<DropdownItem class="space-x-4 flex" on:click={markAllRead}
			><div class="pl-3 w-full text-center">
				mark all as read
			</div></DropdownItem
		>
	{/if}
	<a
		slot="footer"
		href="/invite"
		class="block py-2 -my-1 text-sm font-medium text-center bg-c"
	>
		<div class="inline-flex items-center">
			<svg
				class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400"
				aria-hidden="true"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
				><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path
					fill-rule="evenodd"
					d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
					clip-rule="evenodd"
				/></svg
			>
			View all
		</div>
	</a>
</Dropdown>

<style>
	.accept {
		outline: 1px solid var(--border-color);
		border-radius: 6px;
		width: fit-content;
		padding: 2px;
		text-align: center;
	}
	.accept:hover {
		background-color: var(--button-hover-color);
	}
	.bell {
		display: inline-flex;
		align-items: center;
		font-weight: 500;
		font-size: 0.875rem;
		line-height: 1.25rem;
		text-align: center;
		position: relative;
		left: 0.5rem;
		width: 40px;
		height: 40px;
	}
	.close-button {
		position: relative;
		align-self: flex-start;
		bottom: 0.25rem;
		left: 0.5rem;
		cursor: pointer;
	}
	.new-notifications {
		display: inline-flex;
		position: relative;
		top: -0.5rem;
		right: 0.75rem;
		width: 0.875rem;
		height: 0.875rem;
		background-color: red;
		border-radius: 100%;
		border-width: 2px;
		border-color: var(--border-color);
		/* inline-flex relative -top-2 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 */
	}
	.close-button:hover {
		box-shadow: 0 0 3px 2px var(--shadow-color);
		border-radius: 6px;
	}
	.bell-icon {
		-webkit-filter: var(--invert);
		filter: var(--invert);
		/* transform: rotate(50deg); */
		/* width: 1.5rem;
		height: 1.5rem; */
		width: 25px;
		height: 25px;
	}
	@media (max-width: 750px) {
		.bell-icon {
			width: 1.25rem;
			height: 1.25rem;
		}
		.bell {
			left: 0.25;
		}
	}
</style>
