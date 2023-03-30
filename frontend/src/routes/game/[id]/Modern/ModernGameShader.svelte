<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/stores";
	import { Modern } from "./Modern";
	// import type { GAME } from "./Constants";
    import type { GameRoom } from "$lib/entities";
	// import {triangulate} from "$lib/svgMesh/triangulateContours";
	// import {contours } from "$lib/svgMesh/svgPathContours";
	// import {parse} from "$lib/svgMesh/parseSvgPath";

	let canvas: HTMLCanvasElement;

	export let room: GameRoom;
	
	let modern: Modern;
	let animation: number;

	// const svgParsed = parse("m 0 0 l 0 555 l 278 555 l 278 278 l 1111 278 l 1111 0 l 0 0 m 278 555 l 278 833 l 555 833 l 555 555 l 278 555 m 555 833 l 555 1111 l 833 1111 l 833 833 l 555 833 m 833 1111 l 833 1389 l 1111 1389 l 1111 1111 l 833 1111 m 0 1389 l 0 1667 l 833 1667 l 833 1389 l 0 1389 z");
	// const contour = contours(svgParsed, 1);
	// // console.log("contour: ", contour[0].flat());
	// // const singleContour = [contour[0]];
	// const triangles = triangulate(contour);
	// console.log("triangles: ", triangles);

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
