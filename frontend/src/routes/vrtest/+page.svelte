<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { Ammo, ammoInit } from './World/Systems/ammo';
	import { createRoom } from './World/Components/room';
	import { createLights} from './World/Components/lights';
	import { createControllers } from './World/Components/controller';
	import { createWorld, objects, loadModel } from './World/World';
	import { createPingPongBall } from './World/Components/pingpongBall';
	import { Racket } from './World/Components/pingpongRacket';
	import { World } from './World/Systems/world';
    import type { PerspectiveCamera, WebGLRenderer } from "three";
    import { Vector } from "./World/Systems/math";

	const model_scale = 0.025;

	let world: World;
	let container: Element | null;
	let scene_container: Element | null;

	onMount(async() => {
		await ammoInit();
		container = scene_container?.querySelector('.pong');
		const VRButton = (await import("three/examples/jsm/webxr/VRButton.js")).VRButton;
		world = new World(container);
		container?.append(world.renderer.domElement);
		container?.append(VRButton.createButton(world.renderer));

		const controller = createControllers(world.renderer, world.scene);
		
		const {light, ambient, hemisphere} = createLights();
		world.scene.add(light, hemisphere);
		world.scene.add(createRoom());

		const pingpongBall = createPingPongBall();
		const racket_old = new Racket(controller.right);
		
		loadModel('./Assets/gltf/table_tennis_racket/scene.gltf',
				'racket', world.scene, model_scale, racket_old.physicsObject);

		controller.right.addEventListener("selectstart", function() {
			const transform = new Ammo.btTransform();
			const position = racket_old.position.add(new Vector(0, 0.5, 0));
			transform.setOrigin(position.intoAmmo());
			const motionState = new Ammo.btDefaultMotionState(transform);
			pingpongBall.setMotionState(motionState);
			pingpongBall.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
			pingpongBall.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
			pingpongBall.activate();
		});

		world.start();
	});

	onDestroy(() => {
		// renderer = null;
		// document.body.removeChild();
		// if (renderer) {
		// 	renderer.dispose();
		// 	console.log("dispose of renderer");
		// }
		// if (scene) {
		// 	scene.clear();
		// 	console.log("clear childs of scene");
		// }
		console.log("destroying");
		// console.log("bnoafsdasd");
	});
</script>

<div bind:this="{scene_container}">
	<div class="pong"/>
</div>

<svelte:window />
