<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { ammoInit } from './World/Systems/ammo';
	import { addRoomToWorld } from './World/Components/room';
	import { createLights} from './World/Components/lights';
	import { createControllers } from './World/Components/controller';
	import { Ball } from './World/Components/ball';
	import { Racket } from './World/Components/racket';
	import { World } from './World/Systems/world';
    import { Vector } from "./World/Systems/math";
	import { loadModel } from './World/Systems/ModelLoader';

	let world: World;
	let container: Element;
	let condition = true;

	onMount(async() => {
		await ammoInit();
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		world = new World(container);
		container.append(world.renderer.domElement);
		container.append(VRButton.createButton(world.renderer));

		const controller = createControllers(world.renderer, world.scene);
		
		const {light, ambient, hemisphere} = createLights();
		world.scene.add(light, hemisphere, ambient);

		addRoomToWorld(world);

		const ball = new Ball();
		world.add(ball);
		console.log("balllll");
		const racketModel = await loadModel("./Assets/gltf/pingpong.gltf", 1);
		if (racketModel === undefined)
			console.log("error loading model")
		else {
			// console.log(controller.right);
			const racket = new Racket(controller.right, racketModel);
			world.add(racket);
			controller.right.addEventListener("selectstart", function() {
				console.log("controller pos: ", controller.right.position);
				ball.position = racket.position.add(new Vector(0, 0.5, 0));
				ball.linearVelocity = new Vector(0, 0, 0);
				ball.angularVelocity = new Vector(0, 0, 0);
			});
		}
		world.start();
	});

	onDestroy(() => {
		console.log("destroying");
	});
</script>

{#if condition}
<div bind:this="{container}" id=sceeee></div>
{/if}

<svelte:window />

<style>
	#sceeee {
		width: 100%;
		height: 100%;
		position: absolute;
	}
</style>
