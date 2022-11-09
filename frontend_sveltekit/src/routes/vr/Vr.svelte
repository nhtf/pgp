<script lang="ts">
	import { Scene, PerspectiveCamera, WebGLRenderer, Color } from 'three';
	import { HemisphereLight, DirectionalLight } from 'three';
	import { SphereGeometry, CylinderGeometry, MeshBasicMaterial, Mesh } from 'three';
	import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
	import { XRHandModelFactory } from "three/examples/jsm/webxr/XRHandModelFactory.js";
	import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
	import { Ammo as AmmoLib } from "./ammo.js";

	(async function() {
		const Ammo = await AmmoLib();

		const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		const collisionDispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		const broadphase = new Ammo.btDbvtBroadphase();
		const constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
		const world = new Ammo.btDiscreteDynamicsWorld(collisionDispatcher, broadphase, constraintSolver, collisionConfiguration);

		world.setGravity(new Ammo.btVector3(0, -9.81, 0));

		const scene = new Scene();
		const camera = new PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new WebGLRenderer();
		camera.position.z = 1;

		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);
		document.body.appendChild(VRButton.createButton(renderer));
		renderer.xr.enabled = true;

		const controllerModelFactory = new XRControllerModelFactory();
		const handModelFactory = new XRHandModelFactory();

		function addController(index) {
			const controller = renderer.xr.getController(index);
			const controllerGrip = renderer.xr.getControllerGrip(index);
			const controllerModel = controllerModelFactory.createControllerModel(controllerGrip);
			const hand = renderer.xr.getHand(index);
			const handModel = handModelFactory.createHandModel(hand);
			
			scene.add(controller);
			controllerGrip.add(controllerModel);
			scene.add(controllerGrip);
			hand.add(handModel);
			scene.add(hand);
		}

		addController(0);
		addController(1);
		
		const hemisphereLight = new HemisphereLight(0xffffff);
		hemisphereLight.intensity = 10.0;
		scene.add(hemisphereLight);

		const objects = [];

		function createObject(geometry, material, shape, mass, position, rotation) {
			const obj = new Mesh(geometry, material);
			const transform = new Ammo.btTransform();
			transform.setIdentity();
			transform.setOrigin(new Ammo.btVector3(...position));
			transform.setRotation(new Ammo.btQuaternion(...rotation));
			const motionState = new Ammo.btDefaultMotionState(transform);
			const localInertia = new Ammo.btVector3(0, 0, 0);
			shape.calculateLocalInertia(mass, localInertia);
			const rigidBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia));
			obj.userData.rigidBody = rigidBody;
			world.addRigidBody(rigidBody);
			scene.add(obj);
			objects.push(obj);
			return rigidBody;
		}

		const sphereRadius = 0.02;
		const sphereGeometry = new SphereGeometry(sphereRadius);
		const sphereMaterial = new MeshBasicMaterial({ color: 0xffffff });
		const sphereShape = new Ammo.btSphereShape(sphereRadius);
		const sphereRigidBody = createObject(sphereGeometry, sphereMaterial, sphereShape, 0.0027, [0, 0.5, 0], [0, 0, 0, 1]);
		sphereRigidBody.setRestitution(0.9);

		const cylinderRadius = 0.15;
		const cylinderHeight = 0.015;
		const cylinderGeometry = new CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight);
		const cylinderMaterial = new MeshBasicMaterial({ color: 0xff0000 });
		const cylinderShape = new Ammo.btCylinderShape(new Ammo.btVector3(cylinderRadius, cylinderHeight / 2, cylinderRadius));
		const cylinderRigidBody = createObject(cylinderGeometry, cylinderMaterial, cylinderShape, 0, [0, 0, 0], [0, 0, 0.0124997, 0.9999219]);
		cylinderRigidBody.setRestitution(0.7);

		let previousTime;
		renderer.setAnimationLoop((currentTime) => {
			if (previousTime !== undefined) {
				const deltaTime = currentTime - previousTime;
				world.stepSimulation(deltaTime / 1000, 30, 1 / 300);
			}
			previousTime = currentTime;
			for (let obj of objects) {
				const transform = new Ammo.btTransform();
				obj.userData.rigidBody.getMotionState().getWorldTransform(transform);
				const origin = transform.getOrigin();
				const rotation = transform.getRotation();
				obj.position.set(origin.x(), origin.y(), origin.z());
				obj.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
			}
			renderer.render(scene, camera);
		});
	})();
</script>
