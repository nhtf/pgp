<script lang="ts">
	import type { PageData } from './$types';
	import Friends from "$lib/components/Friends.svelte";
	import Info from "$lib/components/Info.svelte";
    import Match from '$lib/components/Match.svelte';

	export let data: PageData;

</script>

<div class="block-container">
	<Info/>
	{#if data.user?.id === data.profile.id}
		<Friends/>
	{/if}
	<div class="room flex-col">
		{#each data.games as game}
			<Match {game} user={data.profile}/>
		{/each}
	</div>
</div>
