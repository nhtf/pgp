<script lang="ts">
    import type { User, Member, Message } from "$lib/entities";
	import { BOUNCER } from "$lib/constants";
	import { page } from "$app/stores";
	import { CoalitionColors } from "$lib/enums";
    import { memberStore, userStore } from "$lib/stores"
    import MemberBox from "./MemberBox.svelte";
	import Embed from "./Embed.svelte";

	export let message: Message;
	export let self: Member;

	const tenor_regex = /^https:\/\/media\.tenor\.com\/([^\/]+\/[^\/]+\.gif)$/;
	const role_colors = Object.values(CoalitionColors);

	const me: User = $page.data.user;

	let member = message.member;
	let user = member.user;

	$: member = $memberStore.get(member.id)!;
	$: user = $userStore.get(user.id)!;

	const from_self = me.id === user.id;
	const flex_direction = from_self ? "row-reverse" : "row";
	const align_self = from_self ? "flex-end" : "flex-start";
	const text_align = from_self ? "right" : "left";

	message.embeds = message.embeds || [];
</script>

<div class="message" style={`flex-direction: ${flex_direction}; align-self: ${align_self}`}>
	<MemberBox target={member} {self}/>
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
			{#if embed.rich}
				<Embed digest={embed.digest} url={embed.url} />
			{:else}
				<img class="message-image" src={`${BOUNCER}/${embed.digest}/proxy?${new URLSearchParams({ url: embed.url })}`} alt="embed">
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
		max-width: 10rem;
		max-height: 10rem;
		margin: 0.25rem;
	}

</style>
