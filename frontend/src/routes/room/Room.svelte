<script lang="ts">
    import type { ChatRoom } from "$lib/types";
	import {Access} from "$lib/types";

    const lock = "/Assets/icons/lock.svg";

	export let room: ChatRoom;
	export let click: Function;

</script>

<button class="room" on:click={() => click(room)}>
	{#if room.owner}
	<img class="room-icon" src={room.owner?.avatar} alt=""/>
	{:else}
	<img class="room-icon" src="/avatar-default.png" alt=""/>
	{/if}
	<div class="text-xl">{room.name}</div>
	<!-- <div class="flex flex-col"> -->
		<!-- <div class="text-sm" style="width: 4em;">{room.owner?.username}</div> -->
	<!-- </div>	 -->
	<!-- <div ></div> -->
	{#if room.access == Access.PROTECTED}
		<img class="lock-icon" src={lock} alt="lock">
	{/if}
</button>

<style>

	.room {
		display: flex;
		background-color:var(--box-color);
		border-radius: 6px;
		display: flex;
		font-size: 1.5em;
		gap: 1em;
		padding: 1em;
		align-items: center;
		flex-direction: row;
		width: 100%;
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-bottom-color: var(--border-color)!important;
		border-bottom-width: 2px;
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
	}
</style>