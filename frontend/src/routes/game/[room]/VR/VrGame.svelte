<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { ammoInit } from "./Ammo";
	import { Pong } from "./VRPong";
    import type { GameRoom } from "$lib/entities";
	import {VRButton} from "three/examples/jsm/webxr/VRButton";

	export let room: GameRoom;

	let world: Pong | undefined;
	let container: Element;

	onMount(async() => {
		await ammoInit();
		
		world = new Pong();
		container.append(world.renderer.domElement);
		const vrButton = VRButton.createButton(world.renderer);
		container.append(vrButton);
		await world.start({
			container,
			room,
			member: { ...room.self! }
		});
		vrButton.addEventListener("click", function(_ev) {
			requestAnimationFrame(function() {
				const canvas = document.getElementsByTagName("canvas")[0];
				canvas.style.position = "fixed";
				canvas.style.inset = "77px 5px 5px 5px!important";
				canvas.style.borderRadius = "6px";
				const parent = canvas.parentElement;

				if (!parent?.classList.contains("game-container")) {
					canvas.parentElement!.id = "threejs-unfucker";
				}
			});
		});
	});

	onDestroy(() => {
		world?.stop();
	});
</script>

<div bind:this="{container}" class="game-container"></div>

<style global>
	.game-container {
		position: fixed;
		inset: 77px 5px 5px 5px;
		z-index: 10000;
	}

	.canvas {
		position: fixed!important;
		inset: 77px 5px 5px 5px!important;
		border-radius: 6px!important;
	}

	#threejs-unfucker {
		z-index: -1 !important;
		position: fixed!important;
		inset: 77px 5px 5px 5px!important;
		
	}
</style>
