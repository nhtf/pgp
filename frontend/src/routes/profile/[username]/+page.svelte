<script lang="ts">
	import type { PageData } from './$types';
	import Friends from "$lib/components/Friends.svelte";
    import Match from '$lib/components/Match.svelte';
	import Info from "$lib/components/Info.svelte";
    import { byId } from '$lib/sorting';
    import { friendStore, updateStore } from '$lib/stores';
    import { Entity, Game, User } from '$lib/entities';

	export let data: PageData;

	updateStore(User, data.profile);
	updateStore(Game, data.games);

	if (data.profile.id === data.user?.id) {
		updateStore(User, data.friends!);
		updateStore(Entity, data.friends!.map(({ id }) => { return { id } }), friendStore);
	}

</script>

<div class="block-container pt-2">
	<Info/>
	{#if data.user?.id === data.profile.id}
		<Friends/>
	{/if}
	{#if data.games.length}
		<div class="match">
			<div class="room scrollbar match-content">
				{#each data.games.sort(byId).reverse() as game}
					<Match {game} user={data.profile}/>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>

	.match {
		overflow: hidden;
		height: 100%;
		border-radius: 1rem;
		align-self: center;
	}

	.match-content {
		flex-direction: column;
		height: 100%;
		justify-content: flex-start;
		overflow-y: auto;
		flex-wrap: nowrap;
		align-items: flex-end;
		border-radius: 0px;
	}

	.scrollbar {
		scrollbar-color: var(--scrollbar-thumb) transparent;
		scrollbar-width: thin;
		/* overflow-y: hidden; */
	}

	::-webkit-scrollbar {
		background: transparent;
		width: 11px;
		box-shadow: inset 0 0 10px 10px transparent;
		border-top: solid 1px transparent;
		border-bottom: solid 1px transparent;
	}

	::-webkit-scrollbar-thumb {
		border-top: 3px solid transparent;
		border-left: 3px solid transparent;
		border-right: 2px solid transparent;
		border-bottom: 3px solid transparent;
		border-radius: 8px 8px 8px 8px;
		box-shadow: inset 12px 12px 12px 12px var(--scrollbar-thumb);
		margin: 0px auto;
	}
</style>
