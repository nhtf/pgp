<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Ammo, ammoInit } from "./Ammo";
	import { Pong } from "./VRPong";
	import { page } from "$app/stores";
	import type { PageData } from '../$types';

	let world: Pong | undefined;
	let container: Element;

	onMount(async() => {
		console.log($page.data);

		await ammoInit();
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		
		world = new Pong();
		console.log(world);
		container.append(world.renderer.domElement);
		const vrButton = VRButton.createButton(world.renderer);
		container.append(vrButton);

		await world.start({
			container,
			room: $page.data.params.id,
			member: {
				user: $page.data.user,
				...$page.data.member,
			}
		});

		vrButton.addEventListener("click", function(ev) {
			requestAnimationFrame(function() {
				const canvas = document.getElementsByTagName("canvas")[0];
				const parent = canvas.parentElement;

				if (!parent.classList.contains("game-container")) {
					canvas.parentElement.id = "threejs-unfucker";
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

	canvas {
		position: fixed;
		inset: 77px 5px 5px 5px;
		border-radius: 6px;
	}

	#threejs-unfucker {
		z-index: -1 !important;
	}
</style>
