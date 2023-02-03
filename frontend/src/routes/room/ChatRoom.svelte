<script lang="ts">
    import { page } from "$app/stores";
	import type { Room } from "$lib/types";
	import {Access} from "$lib/types";

    const lock = "/Assets/icons/lock.svg";

	export let room: Room;
	export let click: Function;
	export let joined: boolean;

</script>

<button class="room" on:click={() => click(room)}>
	<div class="chickenss">
		{#if room.owner.id === $page.data.user.id}
			<div class="owner-icon"><img src="/Assets/icons/crown.svg" alt="crown"></div>
		{/if}
		<div class="max-content">
			{#if room.owner}
				<img class="room-icon" src={room.owner?.avatar} alt=""/>
			{:else}
				<img class="room-icon" src="/avatar-default.png" alt=""/>
			{/if}
		</div>
	
	{#if joined}
		<div class="text-xl max-content ">{room.name}</div>
	{:else}
		<div class="text-xl text-gray-700 max-content">{room.name}</div>
	{/if}
	{#if room.access == Access.PROTECTED && !joined}
		<img class="lock-icon" src={lock} alt="lock">
	{/if}
</div>
</button>

<style>

	.chickenss {
		align-items: center;
		display: flex;
	}

	.room {
		display: flex;
		background-color:var(--box-color);
		border-radius: 6px;
		display: flex;
		font-size: 1.5em;
		column-gap: 1rem;
		padding: 0.875rem;
		align-items: center;
		flex-direction: row;
		width: 100%;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-bottom-color: var(--border-color)!important;
		border-bottom-width: 2px;
	}

	.max-content {
		width: max-content;
	}

	.room:hover {
		background-color: var(--box-hover-color);
	}

	.lock-icon {
		width: 30px;
		height: 30px;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		position: relative;
	}

	.room-icon {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 1px solid var(--border-color);
	}

	.owner-icon {
		width: 20px;
		height: 20px;
		-webkit-filter: var(--invert);
		filter: var(--invert);
		position: relative;
		top: 0.75rem;
		right: 0.5rem;
	}
</style>