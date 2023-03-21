<script lang="ts">
	import { page } from "$app/stores";
	import Achievement from "$lib/components/Achievement.svelte";
</script>

<div class="block-hor"><h3>Achievements</h3></div>
<div class="block-hor" id="wrap">
	{#each $page.data.user.achievements as achievement}
		<Achievement achievement={achievement}/>
	{/each}
</div>

<style>
	.block-hor {
		width: -moz-available;
		width: -webkit-fill-available;
	}

	#wrap {
		flex-wrap: wrap;
	}
</style>
