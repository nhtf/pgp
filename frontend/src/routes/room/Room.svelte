<script lang="ts">
    import { Access, type ChatRoom } from "$lib/types";

    const lock = "/Assets/icons/lock.svg";

	export let room: ChatRoom;
	export let click: Function;

</script>

<button class="room" on:click={() => click(room)}>
	<img id="small-avatar" src={room.owner.avatar} alt=""/>
	<div style="width: 4em;">{room.owner.username}</div>
	<div>{room.members.length}</div>
	<div>{room.name}</div>
	{#if room.access == Access.PROTECTED}
		<img src={lock} alt="lock">
	{/if}
</button>

<style>

	.room {
		background-color:steelblue;
		border-radius: 1em;
		display: flex;
		font-size: 1.5em;
		gap: 1em;
		padding: 1em;
	}

	.room img {
		display: flex;
		width: 1.5em;
		height: 1.5em;
		border-radius: 1em;
	}

</style>