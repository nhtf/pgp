import { Ammo } from "./Ammo";
import * as THREE from "three";
import { State } from "./Net";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "./Net";
import type { Entity, EntityObject, EntityUpdate } from "./Entity";
import { Vector, Quaternion } from "./Math";
import type { VectorObject, QuaternionObject } from "./Math";

export const TICKS_PER_SECOND = 60;
export const STEPS_PER_TICK = 5;

export interface ThreeObject {
	dispose(): void;
}

export interface Snapshot extends NetSnapshot {
	entities: EntityObject[];
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
}

export class World extends State {
	private ammoObjects: any[];
	private threeObjects: ThreeObject[];
	private physicsObjectId: number;
	public scene: THREE.Scene;
	public renderer: THREE.WebGLRenderer;
	public camera: THREE.PerspectiveCamera;
	public cameraGroup: THREE.Group;
	public world: Ammo.btDiscreteDynamicsWorld;
	public entities: Entity[];
	private blueprints: Map<string, { (entity: EntityObject): Entity; }>;
	private collisionConfiguration: Ammo.btDefaultCollisionConfiguration;
	private collisionDispatcher: Ammo.btCollisionDispatcher;
	private broadphaseInterface: Ammo.btDbvtBroadphase;
	private constraintSolver: Ammo.btSequentialImpulseConstraintSolver;

	public constructor() {
		super();

		this.ammoObjects = [];
		this.threeObjects = [];
		this.physicsObjectId = 0;

		this.collisionConfiguration = this.addAmmoObject(new Ammo.btDefaultCollisionConfiguration());
		this.collisionDispatcher = this.addAmmoObject(new Ammo.btCollisionDispatcher(this.collisionConfiguration));
		this.broadphaseInterface = this.addAmmoObject(new Ammo.btDbvtBroadphase());
		this.constraintSolver = this.addAmmoObject(new Ammo.btSequentialImpulseConstraintSolver());
		
		this.scene = new THREE.Scene();
		this.renderer = this.addThreeObject(new THREE.WebGLRenderer({ antialias: true }));
		this.camera = new THREE.PerspectiveCamera(90, 1, 0.1, 1000);
		this.cameraGroup = new THREE.Group();
		this.world = this.addAmmoObject(new Ammo.btDiscreteDynamicsWorld(this.collisionDispatcher, this.broadphaseInterface, this.constraintSolver, this.collisionConfiguration));
		this.world.setGravity(this.addAmmoObject(new Ammo.btVector3(0, -9.81, 0)));
		this.world.getSolverInfo().set_m_solverMode(0);
		this.entities = [];
		this.blueprints = new Map();
		
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.physicallyCorrectLights = true;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.xr.enabled = true;

		this.cameraGroup.add(this.camera);
		this.scene.background = new THREE.Color("skyblue");
		this.scene.add(this.cameraGroup);

		this.on("create", netEvent => {
			const event = netEvent as CreateEvent;
			console.log("create event", event.entity.uuid);
			this.create(event.entity);
		});

		this.on("update", netEvent => {
			const event = netEvent as UpdateEvent;
			this.update(event.entity);
		});

		this.on("delete", netEvent => {
			const event = netEvent as DeleteEvent;
			this.delete(event.entity.uuid);
		});
	}

	public create(object: EntityObject) {
		let entity = this.get(object.uuid);

		if (entity === null) {
			const blueprint = this.blueprints.get(object.name);

			if (blueprint !== undefined) {
				this.add(blueprint(object));
			}
		}

		this.update(object);
	}

	public update(object: EntityUpdate) {
		let entity = this.get(object.uuid);

		if (entity !== null) {
			entity.load(object);
			entity.lastUpdate = this.time;
		}
	}

	public delete(uuid: string) {
		const entity = this.get(uuid);

		if (entity !== null) {
			this.remove(entity);
			entity.destroy();
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
	}

	public sendCreate(object: EntityObject) {
		this.send("create", { entity: object });
	}

	public sendUpdate(object: EntityUpdate) {
		this.send("update", { entity: object });
	}

	public sendCreateOrUpdate(object: Partial<EntityObject>) {
		const entity = this.get(object.uuid!);

		if (entity === null) {
			object.pos ??= new Vector(0, 0, 0).intoObject();
			object.rot ??= new Quaternion(0, 0, 0, 1).intoObject();
			object.lv ??= new Vector(0, 0, 0).intoObject();
			object.av ??= new Vector(0, 0, 0).intoObject();
			object.tp ??= null;
			object.tr ??= null;
			this.sendCreate(object as EntityObject);
		} else {
			delete object.name;
			this.sendUpdate(object as EntityUpdate);
		}
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
		for (let entity of [...this.entities]) {
			entity.earlyTick();

			if (entity.removed) {
				this.remove(entity);
				entity.destroy();
			}
		}

		super.earlyTick();
	}
	
	public lateTick() {
		for (let entity of this.entities) {
			this.world.removeRigidBody(entity.physicsObject);
			entity.physicsObject.forceActivationState(1);
			entity.position = Vector.fromObject(entity.position.intoObject());
			entity.rotation = Quaternion.fromObject(entity.rotation.intoObject());
			entity.linearVelocity = Vector.fromObject(entity.linearVelocity.intoObject());
			entity.angularVelocity = Vector.fromObject(entity.angularVelocity.intoObject());
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

			this.broadphaseInterface.resetPool(this.collisionDispatcher);
			this.constraintSolver.reset();
			this.world.stepSimulation(1 / TICKS_PER_SECOND / STEPS_PER_TICK, 1, 1 / TICKS_PER_SECOND / STEPS_PER_TICK);

			const numManifolds = this.collisionDispatcher.getNumManifolds();

			for (let i = 0; i < numManifolds; i++) {
				const manifold = this.collisionDispatcher.getManifoldByIndexInternal(i);
				const body0 = manifold.getBody0().getUserIndex();
				const body1 = manifold.getBody1().getUserIndex();
				const entity0 = this.entities.find(e => e.physicsObject.getUserIndex() == body0);
				const entity1 = this.entities.find(e => e.physicsObject.getUserIndex() == body1);

				if (manifold.getNumContacts() > 0) {
					const contact = manifold.getContactPoint(0);
					const contact0 = Vector.moveFromAmmo(contact.getPositionWorldOnA());
					const contact1 = Vector.moveFromAmmo(contact.getPositionWorldOnB());
					entity0?.onCollision(entity1 ?? null, contact0, contact1);
					entity1?.onCollision(entity0 ?? null, contact1, contact0);
				}
			}
		}

		for (let entity of this.entities) {
			entity.lateTick();
		}

		super.lateTick();
	}

	public save(): Snapshot {
		const entities = [];

		const sortedEntities = this.entities;
		sortedEntities.sort((a, b) => a.uuid.localeCompare(b.uuid));

		for (let entity of sortedEntities) {
			if (entity.dynamic) {
				entities.push(entity.save());
			}
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
			this.create(entity);
		}

		for (let entity of this.entities) {
			if (!uuids.has(entity.uuid) && entity.dynamic) {
				this.delete(entity.uuid);
			}
		}

		super.load(snapshot);
	}

	public render(deltaTime: number) {}

	public start(options: Options) {
		let previousRenderTime: number;
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

			this.renderer.render(this.scene, this.camera);
		});
		
		super.start(options);
	}

	public stop() {
		this.renderer.setAnimationLoop(null);

		this.ammoObjects.forEach(obj => Ammo.destroy(obj));
		this.threeObjects.forEach(obj => obj.dispose());

		super.stop();
	}

	public addAmmoObject<T>(obj: T): T {
		this.ammoObjects.push(obj);
		return obj;
	}

	public addThreeObject<T extends ThreeObject>(obj: T): T {
		this.threeObjects.push(obj);
		return obj;
	}
}
