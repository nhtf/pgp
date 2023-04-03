<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Ammo, ammoInit } from "./Ammo";
	import { Pong } from "./VRPong";
	import { page } from "$app/stores";
    import type { GameRoom } from "$lib/entities";
	import {VRButton} from "three/examples/jsm/webxr/VRButton";

	export let room: GameRoom;

	let world: Pong | undefined;
	let container: Element;

	onMount(async() => {
		console.log($page.data);
		const startTime = Date.now();
		console.log("starting ammo init");
		await ammoInit();
		
		world = new Pong();
		console.log(world);
		console.log("created world");
		container.append(world.renderer.domElement);
		const vrButton = VRButton.createButton(world.renderer);
		container.append(vrButton);
		console.log("starting world");
		await world.start({
			container,
			room,
			member: {
				user: $page.data.user,
				...$page.data.member,
			}
		});
		console.log("world has started", Date.now() - startTime);
		vrButton.addEventListener("click", function(ev) {
			requestAnimationFrame(function() {
				const canvas = document.getElementsByTagName("canvas")[0];
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
		inset: 177px 5px 5px 5px;
		z-index: 10000;
	}

	.canvas {
		position: fixed;
		inset: 77px 5px 5px 5px;
		border-radius: 6px;
	}

	#threejs-unfucker {
		z-index: -1 !important;
	}
</style>
