<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { Modern } from "./Modern";
    import type { GameRoom } from "$lib/entities";

	let canvas: HTMLCanvasElement;

	export let room: GameRoom;
	
	let modern: Modern;
	let animation: number;

	onMount(async () => {
		const gameMode = room.state!.teams.length / 2 - 1;

		modern = new Modern(gameMode);

		await modern.init(canvas);
		await modern.start({ room, member: { ...room.self!, user: $page.data.user } as any});

		animation = window.requestAnimationFrame(function render(time) {
			modern.update(time);
			animation = window.requestAnimationFrame(render);
		});
		//this is to lock the cursor, with this mouse only sends mousemove instead of location
		if (room.self?.player) {
			canvas.requestPointerLock();
			canvas.addEventListener('click', function() { canvas.requestPointerLock();}, false);
		}
	});

	onDestroy(() => {
		modern.stop();
		cancelAnimationFrame(animation);//this is needed otherwise it will continue to update even after going to other page
	});

</script>

<div>
<canvas bind:this={canvas}></canvas>
</div>

<div class="game-finished">Game Finished!</div>

<style>
	canvas {
		position: fixed!important;
		inset: 225px 5px 5px 5px!important;
		border-radius: 6px!important;
		height: calc(100vh - 230px);
		width: calc(100vw - 10px);
	}

	.game-finished {
		font-family: 'pong';
		position: fixed;
		display: none;
		border-radius: 0.5rem;
		padding: 1rem;
		margin: auto;
		background-color: transparent;
		align-self: center;
		cursor:default;
		top: calc(50% + 4.25rem);
		font-size: xx-large;
		text-shadow: 2px 2px black;
	}
</style>