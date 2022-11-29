import { Ammo } from "./ammo";
import * as THREE from "three";
import type { Entity, EntityObject } from "./entity";
import { Vector, Quaternion } from "./math";
import type { VectorObject, QuaternionObject } from "./math";
import { createLights} from "../Components/lights";
import { collisionHandler } from "./CollisionHandler";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';

export interface WorldObject {
	entities: EntityObject[];
	stepCount: number;
}

export interface WorldEvent {
	type: string;
	target: string;
	stepCount: number;
	data: any;
}

export class World {
	scene: THREE.Scene;
	world: Ammo.btDiscreteDynamicsWorld;
	renderer: THREE.WebGLRenderer;
	camera: THREE.PerspectiveCamera;
	cameraGroup: THREE.Group;
	container: Element;
	clientWidth: number = 0;
	clientHeight: number = 0;
	entities: Entity[] = [];
	stepCount: number = 0;
	stepsPerSecond: number = 300;
	snapshots: WorldObject[];
	events: WorldEvent[];
	allEvents: WorldEvent[];
	tickInterval: number = 5;
	snapshotInterval: number = 15;
	eventLifetime: number = 300;
	snapshotLifetime: number = 300;
	composer: EffectComposer;
	broadphase: Ammo.btDbvtBroadphase;

	constructor(container: Element) {
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color("skyblue");

		const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		const collisionDispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		this.broadphase = new Ammo.btDbvtBroadphase();
		const constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
		this.world = new Ammo.btDiscreteDynamicsWorld(collisionDispatcher, this.broadphase, constraintSolver, collisionConfiguration);
		this.world.setGravity(new Ammo.btVector3(0, 0, 0));
	
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.physicallyCorrectLights = true;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.xr.enabled = true;
		
		this.composer = new EffectComposer(this.renderer);

		const lights = createLights();
		this.scene.add(lights.light);
		this.scene.add(lights.hemisphere);
		this.scene.add(lights.pointLight);
		this.scene.add(lights.ambient);
		
		const cameraFov = 90;
		const cameraAspect = 1;
		const cameraNear = 0.1;
		const cameraFar = 1000;
		this.camera = new THREE.PerspectiveCamera(cameraFov, cameraAspect, cameraNear, cameraFar);
		this.camera.position.set(0, 1.8, 0);

		this.cameraGroup = new THREE.Group();
		this.cameraGroup.position.set(-2.5, 0, 0);
		this.cameraGroup.rotateY(-Math.PI / 2);
		this.scene.add(this.cameraGroup);
		this.cameraGroup.add(this.camera);

		this.container = container;
		this.snapshots = [];
		this.events = [];
		this.allEvents = [];
	}

	private resize() {
		if (this.clientWidth !== this.container.clientWidth || this.clientHeight != this.container.clientHeight) {
			this.clientWidth = this.container.clientWidth;
			this.clientHeight = this.container.clientHeight;
			this.camera.aspect = this.clientWidth / this.clientHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(this.clientWidth, this.clientHeight);
			this.renderer.setPixelRatio(window.devicePixelRatio);
		}
	}

	add(entity: Entity) {
		this.entities.push(entity);
		this.scene.add(entity.renderObject);
		this.world.addRigidBody(entity.physicsObject);
	}

	onSnapshot(snapshot: WorldObject) {

	}

	step(stepTarget: number, fast: boolean = true) {
		while (this.stepCount < stepTarget) {
			if (this.stepCount % this.tickInterval == 0 && !fast) {
				for (let entity of this.entities) {
					entity.tick(this.tickInterval / this.stepsPerSecond);
				}
			}

			this.playEvents();
			
			if (this.stepCount % this.tickInterval == 0) {
				for (let entity of this.entities) {
					entity.postTick(this.tickInterval / this.stepsPerSecond);
				}
			}

			if (this.stepCount % this.snapshotInterval == 0 && !fast) {
				const snapshot = this.createSnapshot();
				this.snapshots.push(snapshot);
				this.snapshots = this.snapshots.filter(snapshot => snapshot.stepCount > this.stepCount - this.snapshotLifetime);
				this.onSnapshot(snapshot);
			}

			this.broadphase.resetPool(null);
			this.world.stepSimulation(1 / this.stepsPerSecond, 1, 1 / this.stepsPerSecond);
			this.stepCount += 1;
			collisionHandler(this);
		}
	}

	start() {
		let previousTime: number;

		this.renderer.setAnimationLoop((currentTime) => {
			if (previousTime !== undefined) {
				const timeDelta = (currentTime - previousTime) / 1000;
				const stepDelta = Math.floor(timeDelta * this.stepsPerSecond);
				this.step(this.stepCount + stepDelta, false);
				previousTime += stepDelta / this.stepsPerSecond * 1000;
			} else {
				previousTime = currentTime;
			}

			for (let entity of this.entities) {
				entity.update();
			}

			this.resize();
			// this.composer.render();
			this.renderer.render(this.scene, this.camera);
		});
	}

	stop() {
		console.log("stopping animation loop");
		this.renderer.setAnimationLoop(null);
	}

	getEntity(name: string): Entity | null {
		for (let entity of this.entities) {
			if (entity.name === name) {
				return entity;
			}
		}

		return null;
	}

	playEvent(event: WorldEvent) {
		if (event.stepCount != this.stepCount) {
			console.error("bad step count in playEvent");
			return;
		}

		const entity = this.getEntity(event.target);

		if (entity === null) {
			console.error("bad target in playEvent");
			return;
		}

		if (event.type === "move") {
			entity.position = Vector.fromObject(event.data.position);
			entity.rotation = Quaternion.fromObject(event.data.rotation);
			entity.linearVelocity = Vector.fromObject(event.data.linearVelocity);
			entity.angularVelocity = Vector.fromObject(event.data.angularVelocity);
		} else if (event.type === "target") {
			entity.target = event.data;
		} else {
			console.error("bad event type in playEvent");
			return;
		}
	}

	playEvents() {
		for (let event of this.allEvents) {
			if (event.stepCount == this.stepCount) {
				this.playEvent(event);
			}
		}

		this.allEvents = this.allEvents.filter(event => event.stepCount > this.stepCount - this.eventLifetime);
		this.events = this.events.filter(event => event.stepCount > this.stepCount - this.eventLifetime);
	}

	createEvent(partialEvent: Partial<WorldEvent>) {
		partialEvent.stepCount = this.stepCount;
		const event = partialEvent as WorldEvent;
		this.events.push(event);
		this.allEvents.push(event);
	}

	createSnapshot(): WorldObject {
		const result: WorldObject = {
			entities: [],
			stepCount: this.stepCount,
		};

		for (let entity of this.entities) {
			if (entity.name !== null) {
				result.entities.push(entity.serialize());
			}
		}

		return result;
	}

	loadSnapshot(world: WorldObject) {
		this.stepCount = world.stepCount;

		for (let entityObject of world.entities) {
			const entity = this.getEntity(entityObject.name);

			if (entity === null) {
				console.error("bad entity in loadSnapshot");
				continue;
			}

			entity.deserialize(entityObject);
		}
	}
}
