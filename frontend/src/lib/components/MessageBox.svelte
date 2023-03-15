<script lang="ts">
	import type { Member, Message } from "$lib/entities";
	import { BOUNCER, icon_path } from "$lib/constants";
	import { page } from "$app/stores";
	import { CoalitionColors } from "$lib/enums";
	import { memberStore, userStore } from "$lib/stores";
	import { unwrap } from "$lib/Alert";
	import { remove } from "$lib/Web";
	import MemberBox from "./MemberBox.svelte";
	import EmbedBox from "$lib/components/EmbedBox.svelte";
	import linkifyStr from "linkify-string";
	import "linkify-plugin-mention";

	export let message: Message;
	export let self: Member;

	// const tenor_regex = /^https:\/\/media\.tenor\.com\/([^\/]+\/[^\/]+\.gif)$/;
	const role_colors = Object.values(CoalitionColors);
	const trash = `${icon_path}/trash.svg`;

	const from_self = $page.data.user?.id === message.userId;
	const flex_direction = from_self ? "row-reverse" : "row";
	const align_self = from_self ? "flex-end" : "flex-start";
	const text_align = from_self ? "right" : "left";

	$: user = $userStore.get(message.userId)!;
	$: member = message.memberId ? $memberStore.get(message.memberId)! : null;

	async function censor() {
		await unwrap(remove(`/chat/id/${self.roomId}/messages/${message.id}`));
	}
</script>

<div
	class="message"
	style={`flex-direction: ${flex_direction}; align-self: ${align_self}`}
>
	<MemberBox {user} {member} {self} memberGroup={false} />
	<div class="message-box">
		<div class="flex">
			<div
				class="text-sm underline"
				style={`text-align: ${text_align}; color: ${
					member ? `#${role_colors[member.role]}` : "white"
				}`}
			>
				{user.username}
			</div>
			{#if !member || member.id === self.id || member.role < self.role}
				<div class="grow" />
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
				<EmbedBox digest={embed.digest} url={embed.url} />
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
		max-width: 5rem;
		max-height: 5rem;
		margin: 0.25rem;
	}
</style>
