<script lang="ts">
    import type { DMRoom, User } from "$lib/entities";
    import { blockStore, roomStore, userStore } from "$lib/stores";
    import { unwrap } from "$lib/Alert";
    import { post, remove } from "$lib/Web";

	export let room: DMRoom | undefined;

	$: room = $roomStore.get(room!.id);
	$: other = room?.other ? $userStore.get(room?.other.id) : undefined;
	$: blockedIds = [...$blockStore.keys()];

	async function block(user: User) {
		await unwrap(post(`/user/me/blocked`, { id: user.id }));
	}

	async function unblock(user: User) {
		await unwrap(remove(`/user/me/blocked/${user.id}`));
	}
</script>

{#if room && other}
	<div class="room">
		<img class="avatar" src={other.avatar} alt="avatar"/>
		<div class="text-lg">{other.username}</div>
		<div class="grow"/>
		{#if blockedIds.includes(other.id)}
			<button class="button border-red" on:click={unblock.bind({}, other)}>Unblock</button>
		{:else}
			<button class="button border-red" on:click={block.bind({}, other)}>Block</button>
		{/if}
		<a class="button border-blue" href={room?.route}>Enter</a>
	</div>
{/if}
