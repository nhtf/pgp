<script lang="ts">
	export let data;
</script>

<div class="container">
	{#each data.rooms as room}
		<div class="room">
			<a href=/game/{room.id}>{room.name}</a>
		</div>
	{/each}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 25px 10px;
	}

	.room {
		background: var(--box-color);
		border-color: var(--border-color);
		border-radius: 6px;
		border-width: 2px;
		padding: 25px;
	}

	a {
		color: red;
	}
</style>
