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
		canvas.requestPointerLock();

		//this is to lock the cursor, with this mouse only sends mousemove instead of location
		//TODO if specator don't do this
		// canvas.addEventListener('click', function() { canvas.requestPointerLock();}, false);
	});

	onDestroy(() => {
		modern.stop();
		cancelAnimationFrame(animation);//this is needed otherwise it will continue to update even after going to other page
	});

	

</script>


<canvas bind:this={canvas}></canvas>
