import { Ammo } from "./Ammo";
import * as THREE from "three";
import { State } from "./Net";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "./Net";
import type { Entity, EntityObject } from "./Entity";
import { Vector, Quaternion } from "./Math";
import type { VectorObject, QuaternionObject } from "./Math";

export const TICKS_PER_SECOND = 60;
export const STEPS_PER_TICK = 5;

export interface Snapshot extends NetSnapshot {
	entities: EntityObject[];
}

export interface UpdateEvent extends NetEvent {
	entity: EntityObject;
}

export interface DeleteEvent extends NetEvent {
	entity: { uuid: string };
}

export interface Options extends NetOptions {
	container: Element;
}

export class World extends State {
	public scene: THREE.Scene;
	public renderer: THREE.WebGLRenderer;
	public camera: THREE.PerspectiveCamera;
	public world: Ammo.btDiscreteDynamicsWorld;
	private entities: Entity[];
	private blueprints: Map<string, { (entity: EntityObject): Entity; }>;
	private broadphaseInterface: Ammo.btDbvtBroadphase;
	private constraintSolver: Ammo.btSequentialImpulseConstraintSolver;

	public constructor() {
		super();

		const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		const collisionDispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		this.broadphaseInterface = new Ammo.btDbvtBroadphase();
		this.constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
		
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
		this.world = new Ammo.btDiscreteDynamicsWorld(collisionDispatcher, this.broadphaseInterface, this.constraintSolver, collisionConfiguration);
		this.world.setGravity(new Ammo.btVector3(0, -9.81, 0));
		this.entities = [];
		this.blueprints = new Map();
		
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.physicallyCorrectLights = true;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.xr.enabled = true;

		this.scene.background = new THREE.Color("skyblue");
		this.scene.add(this.camera);

		this.on("update", netEvent => {
			const event = netEvent as UpdateEvent;
			this.update(event.entity);
		});

		this.on("delete", netEvent => {
			const event = netEvent as DeleteEvent;
			this.delete(event.entity.uuid);
		});
	}

	private update(object: EntityObject) {
		let entity = this.get(object.uuid);

		if (entity === null) {
			const blueprint = this.blueprints.get(object.name);

			if (blueprint !== undefined) {
				entity = blueprint(object);
				this.scene.add(entity.renderObject);
				this.world.addRigidBody(entity.physicsObject);
				this.entities.push(entity);
			}
		}

		if (entity !== null) {
			entity.load(object);
		}
	}

	private delete(uuid: string) {
		const entity = this.get(uuid);

		if (entity !== null) {
			this.scene.remove(entity.renderObject);
			this.world.removeRigidBody(entity.physicsObject);
			entity.destroy();
			this.entities.splice(this.entities.indexOf(entity), 1);
		}
	}

	public sendUpdate(name: string, uuid: string, object: Partial<EntityObject>) {
		let entity = this.get(uuid);

		this.send("update", {
			entity: {
				name,
				uuid,
				position: object.position ?? entity?.position ?? new Vector(0, 0, 0).intoObject(),
				rotation: object.rotation ?? entity?.rotation ?? new Quaternion(0, 0, 0, 1).intoObject(),
				linearVelocity: object.linearVelocity ?? entity?.linearVelocity ?? new Vector(0, 0, 0).intoObject(),
				angularVelocity: object.angularVelocity ?? entity?.angularVelocity ?? new Vector(0, 0, 0).intoObject(),
				targetPosition: object.targetPosition !== undefined ? object.targetPosition : (entity?.targetPosition ?? null),
				targetRotation: object.targetRotation !== undefined ? object.targetRotation : (entity?.targetRotation ?? null),
			}
		});
	}

	public sendDelete(uuid: string) {
		this.send("delete", { entity: { uuid } });
	}

	public register(name: string, blueprint: { (entity: EntityObject): Entity; }) {
		this.blueprints.set(name, blueprint);
	}

	public get(uuid: string): Entity | null {
		for (let entity of this.entities) {
			if (entity.uuid === uuid) {
				return entity;
			}
		}

		return null;
	}

	public earlyTick() {
		for (let entity of this.entities) {
			entity.earlyTick();
		}

		super.earlyTick();
	}
	
	public lateTick() {
		this.broadphaseInterface.resetPool(null as unknown as Ammo.btDispatcher);
		this.constraintSolver.reset();

		for (let i = 0; i < STEPS_PER_TICK; i++) {
			for (let entity of this.entities) {
				entity.physicsTick();
			}

			this.world.stepSimulation(1 / TICKS_PER_SECOND / STEPS_PER_TICK, 1, 1 / TICKS_PER_SECOND / STEPS_PER_TICK);
		}

		for (let entity of this.entities) {
			entity.lateTick();
		}

		super.lateTick();
	}

	public save(): Snapshot {
		const entities = [];

		for (let entity of this.entities) {
			entities.push(entity.save());
		}

		return {
			entities,
			...super.save(),
		}
	}

	public load(snapshot: Snapshot) {
		const uuids = new Set();

		for (let entity of snapshot.entities) {
			uuids.add(entity.uuid);
			this.update(entity);
		}

		for (let entity of this.entities) {
			if (!uuids.has(entity.uuid)) {
				this.delete(entity.uuid);
			}
		}

		super.load(snapshot);
	}

	public start(options: Options) {
		let previousTime: number;
		let clientWidth: number;
		let clientHeight: number;

		this.renderer.setAnimationLoop((currentTime) => {
			if (previousTime !== undefined) {
				const timeDelta = (currentTime - previousTime) / 1000;
				const stepDelta = Math.floor(timeDelta * TICKS_PER_SECOND);

				for (let i = 0; i < stepDelta; i++) {
					this.tick();
				}

				previousTime += stepDelta / TICKS_PER_SECOND * 1000;
			} else {
				previousTime = currentTime;
			}
		
			if (clientWidth !== options.container.clientWidth || clientHeight != options.container.clientHeight) {
				clientWidth = options.container.clientWidth;
				clientHeight = options.container.clientHeight;
				this.camera.aspect = clientWidth / clientHeight;
				this.camera.updateProjectionMatrix();
				this.renderer.setSize(clientWidth, clientHeight);
				this.renderer.setPixelRatio(window.devicePixelRatio);
			}

			this.renderer.render(this.scene, this.camera);
		});
		
		super.start(options);
	}
}
