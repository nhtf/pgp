<script lang="ts">
	import { Dropdown, DropdownItem, Avatar } from "flowbite-svelte";
	import type { Invite } from "$lib/types";
	import { page } from "$app/stores";
	import { respond } from "$lib/invites";
	import { onDestroy, onMount } from "svelte";
	import { Subject, Action, type User } from "$lib/types";
	import type { UpdatePacket } from "$lib/types";
	import { updateManager } from "$lib/updateSocket";
	import { afterUpdate } from "svelte";
	import { bounceOut as anim } from "svelte/easing";
    import { inviteStore } from "../stores";

	enum Status {
		UNREAD,
		READ,
		REMOVED,
	}

	let notificationss: Map<Invite, Status>;


	// TODO: fix notification
	$: user = $page.data.user as User;
	$: invites = $page.data.invites as Invite[];
	$: _notifications = new Map(invites.map((invite) => [invite, Status.UNREAD]));
	$: _newNotifs = [..._notifications].some((notif) => notif[1] === Status.UNREAD);

	$: notifications = invites.filter((invite) => invite.to.id === user.id);
	$: notifMap = new Map<Invite, Status>();
	$: newNotifs = true;
	$: length = countNotifs();

	onMount(() => {
		inviteStore.subscribe((inv) => {
			invites = [...inv.values()];
			newNotifs = true;
		});
	
		// updateManager.set(Subject.INVITE, updateInvite);
		notifications.forEach((notif) => notifMap.set(notif, Status.UNREAD));
		length = countNotifs();
		if (length === 0) newNotifs = false;
	});

	onDestroy(() => {
		updateManager.remove(Subject.INVITE);
	});

	function countNotifs(): number {
		let notifs = 0;
		notifMap.forEach((value) => {
			if (value !== Status.REMOVED) {
				notifs += 1;
			}
		});
		return notifs;
	}

	let timer: NodeJS.Timeout | undefined;

	afterUpdate(() => {
		if (timer) {
			clearTimeout(timer);
		}
	});

	//TODO still happens that when you remove a notification you can't click the notification away properly
	async function removeNotification(invite: Invite) {
		//the timer is so that it waits a bit before removing it so that you don't click behind the dropdown menu
		timer = setTimeout(() => {
			notifMap = notifMap.set(invite, Status.REMOVED);
			length = length - 1;
			if (length === 0) {
				newNotifs = false;
			}
		}, 75);
	}

	async function acceptInvite(invite: Invite) {
		await removeNotification(invite);
		await respond(invite, "accept");
	}

	async function updateInvite(update: UpdatePacket) {
		switch (update.action) {
			case Action.ADD:
				invites = [...invites, update.value];

				if (update.value.from.id !== user?.id) {
					notifications = [...notifications, update.value];
					notifMap = notifMap.set(update.value, Status.UNREAD);
					length += 1;
					newNotifs = true;
				}
				break;
			case Action.REMOVE:
				invites = invites.filter((invite) => invite.id !== update.identifier);
			
				if (update.value.from.id !== user?.id) {
					notifications = notifications.filter(
						(invites) => invites.id !== update.identifier
					);
					notifMap.delete(update.value);
					notifMap = notifMap;
					length -= 1;
				}
				break;
		}
	}

	function markAllRead() {
		notifMap.forEach((value, key: Invite) => {
			if (value !== Status.REMOVED) notifMap.set(key, Status.READ);
		});
		notifMap = notifMap;
		newNotifs = false;
	}

	function markRead(key: Invite) {
		notifMap.set(key, Status.READ);
		notifMap = notifMap;
		hasUnread();
	}

	function markUnRead(key: Invite) {
		notifMap.set(key, Status.UNREAD);
		notifMap = notifMap;
		newNotifs = true;
	}

	function hasUnread() {
		let unread = false;
		notifMap.forEach((value, key) => {
			if (value === Status.UNREAD) {
				unread = true;
			}
		});
		newNotifs = unread;
	}

	//TODO typescript this thing
	function spin(node: any, { duration }: { duration: number }) {
		return {
			duration,
			css: (t: number) => {
				const rot_eased = Math.sin(t * 12 * Math.PI);
				let scal_eased = anim(t) + 0.5; //TODO look at scale animation
				if (scal_eased < 0.9) scal_eased = 0.9;
				if (!newNotifs) return "";
				return `transform: rotate(${rot_eased * 45}deg);
						scale: ${scal_eased};`;
			},
		};
	}
</script>

<!-- //TODO sound for notification? -->
<!-- //TODO have the unread and read look different -->
<div id="bell" class="bell">
	{#key newNotifs && length}
		<img
			src="/Assets/icons/bell.svg"
			class="bell-icon"
			alt="bell"
			in:spin={{ duration: 1500 }}
		/>
	{/key}
	<div class="flex relative">
		{#key newNotifs}
			{#if newNotifs}
				<div class="new-notifications" />
			{/if}
		{/key}
	</div>
</div>
<Dropdown
	triggeredBy="#bell"
	class="w-full max-w-sm rounded divide-y bor-c shadow bg-c bor-c"
	frameClass="bor-c shadow divide-y w-full max-w-sm"
	placement="bottom"
>
	<div slot="header" class="text-center py-2 font-bold text-center ">
		Notifications
	</div>
	{#each [...notifMap] as [key, value]}
		{#if value !== Status.REMOVED}
			<DropdownItem class="flex space-x-4">
				<Avatar src={key.from.avatar} />
				<div class="pl-3 w-full">
					<div
						class="text-gray-500 text-sm mb-1.5 dark:text-gray-400"
					>
						New {key.type} invite from
						<span
							class="font-semibold text-gray-900 dark:text-white"
							>{key.from.username}</span
						>
					</div>
					<div class="flex flex-row justify-between items-center">
						<div
							class="block text-xs text-blue-600 dark:text-blue-500 accept"
							on:click={() => acceptInvite(key)}
							on:keypress={() => acceptInvite(key)}
						>
							accept invite
						</div>
						{#if value === Status.UNREAD}
							<div
								class="block text-xs text-blue-600 dark:text-blue-500 accept"
								on:click={() => markRead(key)}
								on:keypress={() => markRead(key)}
							>
								mark as read
							</div>
						{:else}
							<div
								class="block text-xs text-blue-600 dark:text-blue-500 accept"
								on:click={() => markUnRead(key)}
								on:keypress={() => markUnRead(key)}
							>
								mark as unread
							</div>
						{/if}
					</div>
				</div>
				<div class="close-button" title="remove notification">
					<svg
						fill="currentColor"
						width="20"
						height="20"
						on:click={() => removeNotification(key)}
						on:keypress={() => removeNotification(key)}
					>
						<path
							d="M13.42 12L20 18.58 18.58 20 12 13.42
					  5.42 20 4 18.58 10.58 12 4 5.42 5.42
					  4 12 10.58 18.58 4 20 5.42z"
						/>
					</svg>
				</div>
			</DropdownItem>
		{/if}
	{/each}
	{#if length}
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
		height: 100%;
		width: 100%;
		padding: 2px;
		margin-left: 5px;
		margin-right: 5px;
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
		/* .bell-icon {
			width: 1.25rem;
			height: 1.25rem;
		} */

		.bell {
			left: 0.25;
		}
	}
</style>
