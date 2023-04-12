<script lang="ts">
	import type { ChatRoomMember, Message, Room } from "$lib/entities";
	import { BOUNCER, icon_path } from "$lib/constants";
	import { page } from "$app/stores";
	import { CoalitionColors } from "$lib/enums";
	import { memberStore, userStore } from "$lib/stores";
	import { unwrap } from "$lib/Alert";
	import { remove } from "$lib/Web";
	import EmbedBox from "$lib/components/EmbedBox.svelte";
	import linkifyStr from "linkify-string";
    import UserDropdown from "./UserDropdown.svelte";
	import "linkify-plugin-mention";

	export let room: Room;
	export let message: Message;
	export let self: ChatRoomMember | undefined = undefined;

	const role_colors = Object.values(CoalitionColors);
	const trash = `${icon_path}/trash.svg`;

	const from_self = $page.data.user?.id === message.userId;
	const flex_direction = from_self ? "row-reverse" : "row";
	const align_self = from_self ? "flex-end" : "flex-start";
	const text_align = from_self ? "right" : "left";

	$: user = $userStore.get(message.userId)!;
	$: member = message.memberId ? $memberStore.get(message.memberId)! as ChatRoomMember : undefined;

	async function censor() {
		await unwrap(remove(`${room.route}/messages/${message.id}`));
	}
</script>

<div
	class="message"
	style={`flex-direction: ${flex_direction}; align-self: ${align_self}`}
>
	<UserDropdown {user} {member} />
	<div class="flex flex-col gap-1">
		<div class="flex gap-1">
			<div
				class="text-sm underline"
				style={`text-align: ${text_align}; color: ${
					member ? `#${role_colors[member.role]}` : "white"
				}`}
			>
				{user.username}
			</div>
			<div class="grow" />
			{#if user.id === $page.data.user.id || (self && (!member || member.role < self.role))}
				<button on:click={censor}
					><img class="w-5 h-5" src={trash} alt="delete" /></button
				>
			{/if}
		</div>
		<div class="message-content">
			{@html linkifyStr(message.content, {
				className: "link",
				formatHref: { mention: (href) => `/profile${href}` },
			})}
		</div>
		{#each message.embeds as embed}
			{#if embed.rich}
				<EmbedBox {embed} />
			{:else}
				<img
					class="message-image"
					src={`${BOUNCER}/${
						embed.digest
					}/proxy?${new URLSearchParams({ url: embed.url })}`}
					alt="embed"
				/>
			{/if}
		{/each}
	</div>
</div>

<style>
	.message {
		background-color: var(--box-color);
		border-radius: 1rem;
		display: flex;
		gap: 1rem;
		margin: 0.25rem;
		max-width: 100%;
		padding: 0.5rem;
		align-items: start;
	}

	.message-content {
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}

	.message-image {
		max-width: 5rem;
		max-height: 5rem;
		margin: 0.25rem;
	}
</style>
