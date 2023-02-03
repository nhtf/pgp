<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Ammo, ammoInit } from "./Ammo";
	import { Pong } from "./Pong";
	import { page } from "$app/stores";
	import type { PageData } from './$types';

	let world: Pong | undefined;
	let container: Element;

	onMount(async() => {
		console.log($page.data);

		await ammoInit();
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		
		world = new Pong();
		console.log(world);
		container.append(world.renderer.domElement);
		container.append(VRButton.createButton(world.renderer));

		await world.start({ container, room: $page.data.params.id, user: $page.data.user });
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
</style>
