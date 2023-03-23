<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { Modern } from "./Modern";
	import type { GAME } from "./Constants";
    import type { GameRoom } from "$lib/entities";
	// import {triangulate} from "$lib/svgMesh/triangulateContours";
	// import {contours } from "$lib/svgMesh/svgPathContours";
	// import {parse} from "$lib/svgMesh/parseSvgPath";

	let canvas: HTMLCanvasElement;

	export let room: GameRoom;
	
	let modern: Modern;
	let animation: number;

	// const svgParsed = parse("M 103.301 49.902 L 109.363 53.402 L 80.363 103.632 L 74.301 100.132 C 72.866 99.303 72.374 97.469 73.203 96.034 L 99.203 51 C 100.031 49.565 101.866 49.074 103.301 49.902 Z");
	// const contour = contours(svgParsed, 1);
	// console.log("contour: ", contour[0].flat());
	// const singleContour = [contour[0]];
	// const triangles = triangulate(contour);
	// console.log("triangles: ", triangles);

	onMount(async () => {
		const gameMode = room.state.teams.length / 2 - 1;

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
