import { Debug } from "./Debug";
import { Ammo } from "./Ammo";
import * as THREE from "three";
import { Net } from "../Net";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "../Net";
import type { Entity, EntityObject, EntityUpdate } from "./Entity";
import { Vector, Quaternion } from "../Math";
import type { VectorObject, QuaternionObject } from "../Math";
import { Counter, Map2 } from "../Util";

export const TICKS_PER_SECOND = 60;
export const STEPS_PER_TICK = 10;
export const PHYSICS_MULTIPLIER = 1;
export const COLLISION_DELAY = 10;

export interface ThreeObject {
	dispose(): void;
}

export interface Snapshot extends NetSnapshot {
	entities: EntityObject[];
	collisions: [string | null, string | null, number][];
}

export interface CreateEvent extends NetEvent {
	entity: EntityObject;
}

export interface UpdateEvent extends NetEvent {
	entity: EntityUpdate;
}

export interface DeleteEvent extends NetEvent {
	entity: { uuid: string };
}

export interface Options extends NetOptions {
	container: Element;
	debug?: boolean;
}

export class World extends Net {
	private ammoObjects: any[];
	private threeObjects: ThreeObject[];
	private physicsObjectId: number;
	public frameTime: Counter;
	public scene: THREE.Scene;
	public renderer: THREE.WebGLRenderer;
	public camera: THREE.PerspectiveCamera;
	public audioListener: THREE.AudioListener;
	public cameraGroup: THREE.Group;
	public world: Ammo.btDiscreteDynamicsWorld;
	public entities: Entity[];
	public removedEntities: Entity[];
	private blueprints: Map<string, { (entity: EntityObject): Entity; }>;
	private collisionConfiguration: Ammo.btDefaultCollisionConfiguration;
	private collisionDispatcher: Ammo.btCollisionDispatcher;
	private broadphaseInterface: Ammo.btDbvtBroadphase;
	private constraintSolver: Ammo.btSequentialImpulseConstraintSolver;
	private collisions: Map2<Entity | null, Entity | null, number>;
	private debug?: Debug;

	public constructor() {
		super();

		this.ammoObjects = [];
		this.threeObjects = [];
		this.physicsObjectId = 0;
		this.frameTime = new Counter(5);

		this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		this.collisionDispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
		this.broadphaseInterface = new Ammo.btDbvtBroadphase();
		this.constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
		
		this.scene = new THREE.Scene();
		this.renderer = this.addThreeObject(new THREE.WebGLRenderer({ antialias: true }));
		this.camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
		this.audioListener = new THREE.AudioListener();
		this.cameraGroup = new THREE.Group();
		this.world = this.addAmmoObject(new Ammo.btDiscreteDynamicsWorld(this.collisionDispatcher, this.broadphaseInterface, this.constraintSolver, this.collisionConfiguration));
		this.world.setGravity(this.addAmmoObject(new Ammo.btVector3(0, -9.81, 0)));
		this.world.getSolverInfo().set_m_solverMode(0);
		this.entities = [];
		this.removedEntities = [];
		this.collisions = new Map2();
		this.blueprints = new Map();
		
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.physicallyCorrectLights = true;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.xr.enabled = true;

		this.cameraGroup.add(this.camera);
		this.camera.add(this.audioListener);
		this.scene.background = new THREE.Color("skyblue");
		this.scene.add(this.cameraGroup);

		this.on("create", netEvent => {
			const event = netEvent as CreateEvent;
			this.create(event.entity);
		});

		this.on("update", netEvent => {
			const event = netEvent as UpdateEvent;
			const entity = this.get(event.entity.uuid!);
			this.update(event.entity);

			if (entity !== null) {
				entity.lastUpdate = this.time;
			}
		});

		this.on("delete", netEvent => {
			const event = netEvent as DeleteEvent;
			this.delete(event.entity.uuid);
		});
	}

	public create(object: EntityObject) {
		let entity = this.get(object.uuid);

		if (entity === null) {
			entity = this.removedEntities.find(entity => entity.uuid == object.uuid) ?? null;

			if (entity !== null) {
				this.removedEntities.splice(this.removedEntities.indexOf(entity), 1);
				this.add(entity);
				entity.removed = false;
			}
		}

		if (entity === null) {
			const blueprint = this.blueprints.get(object.name);

			if (blueprint !== undefined) {
				this.add(blueprint(object));
			}
		}

		this.update(object);
	}

	public update(object: EntityUpdate) {
		let entity = this.get(object.uuid!);

		if (entity !== null) {
			entity.load(object);
		}
	}

	public delete(uuid: string) {
		const entity = this.get(uuid);

		if (entity !== null) {
			this.remove(entity);
		}
	}

	public add(entity: Entity) {
		this.scene.add(entity.renderObject);
		this.world.addRigidBody(entity.physicsObject);
		this.entities.push(entity);
		entity.physicsObject.setUserIndex(this.physicsObjectId++);
	}

	public remove(entity: Entity) {
		this.scene.remove(entity.renderObject);
		this.world.removeRigidBody(entity.physicsObject);
		this.entities.splice(this.entities.indexOf(entity), 1);
		this.removedEntities.push(entity);
	}

	public sendCreate(object: EntityObject) {
		this.send("create", { entity: object });
	}

	public sendUpdate(object: EntityUpdate) {
		this.send("update", { entity: object });
	}

	public sendCreateOrUpdate(createObject: any, updateObject: any) {
		const entity = this.get(updateObject.uuid!);

		if (entity === null) {
			Object.assign(createObject, updateObject);
			createObject.pos ??= new Vector(0, 0, 0).intoObject();
			createObject.rot ??= new Quaternion(0, 0, 0, 1).intoObject();
			createObject.lv ??= new Vector(0, 0, 0).intoObject();
			createObject.av ??= new Vector(0, 0, 0).intoObject();
			createObject.tp ??= null;
			createObject.tr ??= null;
			createObject.lu ??= this.time;
			this.sendCreate(createObject as EntityObject);
		} else {
			this.sendUpdate(updateObject as EntityUpdate);
		}
	}

	public sendDelete(uuid: string) {
		this.send("delete", { entity: { uuid } });
	}

	public register(name: string, blueprint: { (entity: EntityObject): Entity; }) {
		this.blueprints.set(name, blueprint);
	}

	public get(uuid: string): Entity | null {
		return this.entities.find(entity => entity.uuid == uuid) ?? null;
	}

	public earlyTick() {
		for (let entity of [...this.entities]) {
			entity.earlyTick();

			if (entity.removed) {
				this.remove(entity);
			}
		}

		super.earlyTick();
	}
	
	public lateTick() {
		for (let entity of this.entities) {
			this.world.removeRigidBody(entity.physicsObject);
			entity.physicsObject.forceActivationState(1);
			entity.motionStateFromObject(entity.motionStateIntoObject());
		}

		const sortedEntities = this.entities;
		sortedEntities.sort((a, b) => a.uuid.localeCompare(b.uuid));

		for (let entity of sortedEntities) {
			this.world.addRigidBody(entity.physicsObject);
		}

		for (let i = 0; i < STEPS_PER_TICK; i++) {
			for (let entity of this.entities) {
				entity.physicsTick();
			}

			const subFrame = this.time * STEPS_PER_TICK + i;
			const physicsStep = 1 / TICKS_PER_SECOND / STEPS_PER_TICK * PHYSICS_MULTIPLIER;
			this.broadphaseInterface.resetPool(this.collisionDispatcher);
			this.constraintSolver.reset();
			this.world.stepSimulation(physicsStep, 1, physicsStep);
			const numManifolds = this.collisionDispatcher.getNumManifolds();

			for (let i = 0; i < numManifolds; i++) {
				const manifold = this.collisionDispatcher.getManifoldByIndexInternal(i);
				const body0 = manifold.getBody0().getUserIndex();
				const body1 = manifold.getBody1().getUserIndex();
				const entity0 = this.entities.find(e => e.physicsObject.getUserIndex() == body0) ?? null;
				const entity1 = this.entities.find(e => e.physicsObject.getUserIndex() == body1) ?? null;
				const lastCollision = this.collisions.get(entity0, entity1) ?? -COLLISION_DELAY;

				if (manifold.getNumContacts() > 0 && subFrame - lastCollision >= COLLISION_DELAY) {
					const contact = manifold.getContactPoint(0);
					const contact0 = Vector.moveFromAmmo(contact.getPositionWorldOnA());
					const contact1 = Vector.moveFromAmmo(contact.getPositionWorldOnB());
					entity0?.onCollision(entity1 ?? null, contact0, contact1);
					entity1?.onCollision(entity0 ?? null, contact1, contact0);
					this.collisions.set(entity0, entity1, subFrame);
					this.collisions.set(entity1, entity0, subFrame);
				}
			}
		}

		const subFrame = (this.time + 1) * STEPS_PER_TICK;

		for (let [key1, key2, value] of [...this.collisions.entries()]) {
			if (subFrame - value >= COLLISION_DELAY) {
				this.collisions.delete(key1, key2);
			}
		}

		for (let entity of [...this.entities]) {
			entity.lateTick();

			if (entity.removed) {
				this.remove(entity);
			}
		}

		super.lateTick();
	}

	public save(): Snapshot {
		const entities = [];
		const collisions: [string | null, string | null, number][] = [];

		const sortedEntities = this.entities;
		sortedEntities.sort((a, b) => a.uuid.localeCompare(b.uuid));

		for (let entity of sortedEntities) {
			if (entity.dynamic) {
				entities.push(entity.save());
			}
		}

		for (let [e1, e2, t] of this.collisions.entries()) {
			collisions.push([e1 === null ? null : e1.uuid, e2 === null ? null : e2.uuid, t]);
		}

		return {
			entities,
			collisions,
			...super.save(),
		};
	}

	public load(snapshot: Snapshot) {
		const uuids = new Set();

		for (let entity of snapshot.entities) {
			uuids.add(entity.uuid);
			this.create(entity);
		}

		for (let entity of this.entities) {
			if (!uuids.has(entity.uuid) && entity.dynamic) {
				this.delete(entity.uuid);
			}
		}

		this.collisions.clear();

		for (let [uuid1, uuid2, t] of snapshot.collisions) {
			this.collisions.set(uuid1 === null ? null : this.get(uuid1)!, uuid2 === null ? null : this.get(uuid2)!, t);
		}

		super.load(snapshot);
	}

	public clientTick() {
	}

	public render(deltaTime: number) {
	}

	public async start(options: Options) {
		let previousRenderTime: number;
		let previousTime: number;
		let clientWidth: number;
		let clientHeight: number;
		
		await super.start(options);

		if (options.debug) {
			this.debug = new Debug(this);
		}

		this.renderer.setAnimationLoop((currentTime) => {
			if (previousTime !== undefined) {
				const timeDelta = (currentTime - previousTime) / 1000;
				const stepDelta = Math.floor(timeDelta * TICKS_PER_SECOND);

				for (let i = 0; i < stepDelta; i++) {
					const start = performance.now() / 1000;
					this.clientTick();
					this.tick();

					for (let entity of this.entities) {
						entity.clientTick();
					}

					this.frameTime.add(performance.now() / 1000 - start);
				}

				previousTime += stepDelta / TICKS_PER_SECOND * 1000;
			} else {
				previousTime = currentTime;
			}

			if (previousRenderTime !== undefined) {
				this.render(currentTime - previousRenderTime);
				previousRenderTime = currentTime;
			} else {
				this.render(0);
				previousRenderTime = currentTime;
			}
		
			if (clientWidth !== options.container.clientWidth || clientHeight != options.container.clientHeight) {
				clientWidth = options.container.clientWidth;
				clientHeight = options.container.clientHeight;
				this.camera.aspect = clientWidth / clientHeight;
				this.camera.updateProjectionMatrix();
				this.renderer.setSize(clientWidth, clientHeight);
				this.renderer.setPixelRatio(window.devicePixelRatio);
			}

			if (this.debug !== undefined) {
				this.debug.update();
			}

			this.renderer.render(this.scene, this.camera);
		});
	}

	public stop() {
		this.renderer.setAnimationLoop(null);

		for (let object of this.ammoObjects) {
			Ammo.destroy(object);
		}

		for (let object of this.threeObjects) {
			object.dispose();
		}

		this.ammoObjects = [];
		this.threeObjects = [];

		super.stop();
	}

	public addAmmoObject<T>(obj: T): T {
		this.ammoObjects.push(obj);
		return obj;
	}

	public removeAmmoObject<T>(obj: T) {
		this.ammoObjects.splice(this.ammoObjects.indexOf(obj), 1);
		Ammo.destroy(obj);
	}

	public addThreeObject<T extends ThreeObject>(obj: T): T {
		this.threeObjects.push(obj);
		return obj;
	}

	public removeThreeObject<T extends ThreeObject>(obj: T) {
		this.threeObjects.splice(this.threeObjects.indexOf(obj), 1);
		obj.dispose();
	}
}
