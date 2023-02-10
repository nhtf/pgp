<script lang="ts">
    import { page } from "$app/stores";
	import { Access, type Room } from "$lib/types";

    const lock = "/Assets/icons/lock.svg";

	export let room: Room;
	export let click: Function;
	export let divider: boolean;

	let frameclass = divider ? "room divider" : "room";

</script>

<button class={frameclass} on:click={() => click(room)}>
	<div class="room-block">
		<div class="room-icon-block">
			<div>
				{#if room.owner}
					<img class="room-icon" src={room.owner?.avatar} alt=""/>
				{:else}
					<img class="room-icon" src="/avatar-default.png" alt=""/>
				{/if}
			</div>
			{#if room.owner && room.owner.id === $page.data.user.id}
				<div class="owner-icon"><img src="/Assets/icons/crown.svg" alt="crown"></div>
			{/if}
		</div>
	
		<!-- //TODO maybe other way to make it obvious that you are not a member or are? -->
		{#if room.joined}
			<div class="room-name">{room.name}</div>
		{:else}
			<div class="room-name joinable">{room.name}</div>
		{/if}
	
		{#if room.access == Access.PROTECTED}
			<img class="lock-icon" src={lock} alt="lock">
		{/if}
	</div>
</button>

<style>

	.joinable {
		color: var(--text-disabled-color);
	}

	.room-block {
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
		
	}

	.divider {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-bottom-color: var(--border-color)!important;
		border-bottom-width: 2px;
	}

	.room-name {
		font-size: 1.25rem;
		width: max-content;
		margin-left: 0.5rem;
	}

	.room-icon-block {
		width: 70px;
		display: flex;
		flex-direction: row;
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
		bottom: 0.5rem;
		right: 0.5rem;
	}
</style>