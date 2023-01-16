import { Ammo } from "./Ammo";
import { Vector, Quaternion } from "./Math";
import type { VectorObject, QuaternionObject } from "./Math";
import type { World } from "./World";
import type * as THREE from "three";

export interface EntityObject {
	uuid: string;
	name: string;
	pos: VectorObject;
	rot: QuaternionObject;
	lv: VectorObject;
	av: VectorObject;
	tp: VectorObject | null;
	tr: QuaternionObject | null;
	lu: number;
}

export type EntityUpdate = Partial<EntityObject>;

export abstract class Entity {
	public uuid: string;
	public abstract name: string;
	public abstract dynamic: boolean;
	public renderObject: THREE.Object3D;
	public physicsObject: Ammo.btRigidBody;
	public targetPosition: Vector | null;
	public targetRotation: Quaternion | null;
	public lastUpdate: number;
	public world: World;
	public removed: boolean;

	public constructor(world: World, uuid: string, renderObject: THREE.Object3D, physicsObject: Ammo.btRigidBody) {
		this.world = world;
		this.uuid = uuid;
		this.renderObject = renderObject;
		this.physicsObject = physicsObject;
		this.targetPosition = null;
		this.targetRotation = null;
		this.lastUpdate = 0;
		this.removed = false;
	}

	public get position(): Vector {
		const transform = this.physicsObject.getWorldTransform();
		const vector = Vector.moveFromAmmo(transform.getOrigin());
		Ammo.destroy(transform);
		return vector;
	}

	public get rotation(): Quaternion {
		const transform = this.physicsObject.getWorldTransform();
		const quaternion = Quaternion.moveFromAmmo(transform.getRotation());
		Ammo.destroy(transform);
		return quaternion;
	}

	public get linearVelocity(): Vector {
		return Vector.moveFromAmmo(this.physicsObject.getLinearVelocity());
	}

	public get angularVelocity(): Vector {
		return Vector.moveFromAmmo(this.physicsObject.getAngularVelocity());
	}

	public set position(vector: Vector) {
		const transform = this.physicsObject.getWorldTransform();
		const ammoVector = vector.intoAmmo();
		transform.setOrigin(ammoVector);
		this.physicsObject.setWorldTransform(transform);
		Ammo.destroy(transform);
		Ammo.destroy(ammoVector);
	}

	public set rotation(quaternion: Quaternion) {
		const transform = this.physicsObject.getWorldTransform();
		const ammoQuaternion = quaternion.intoAmmo();
		transform.setRotation(ammoQuaternion);
		this.physicsObject.setWorldTransform(transform);
		Ammo.destroy(transform);
		Ammo.destroy(ammoQuaternion);
	}

	public set linearVelocity(vector: Vector) {
		const ammoVector = vector.intoAmmo();
		this.physicsObject.setLinearVelocity(ammoVector);
		Ammo.destroy(ammoVector);
	}

	public set angularVelocity(vector: Vector) {
		const ammoVector = vector.intoAmmo();
		this.physicsObject.setAngularVelocity(ammoVector);
		Ammo.destroy(ammoVector);
	}

	public earlyTick() {
	}

	public physicsTick() {
		if (this.targetPosition !== null) {
			let position = this.targetPosition;
			this.linearVelocity = position.sub(this.position).scale(50);
		}

		if (this.targetRotation !== null) {
			let rotation = this.targetRotation;
			this.angularVelocity = rotation.mul(this.rotation.inverse()).euler().scale(50);
		}
	}

	public lateTick() {
		this.renderObject.position.copy(this.position.intoThree());
		this.renderObject.quaternion.copy(this.rotation.intoThree());
	}

	public save(): EntityObject {
		return {
			uuid: this.uuid,
			name: this.name,
			pos: this.position.intoObject(),
			rot: this.rotation.intoObject(),
			lv: this.linearVelocity.intoObject(),
			av: this.angularVelocity.intoObject(),
			tp: this.targetPosition ? this.targetPosition.intoObject() : null,
			tr: this.targetRotation ? this.targetRotation.intoObject() : null,
			lu: this.lastUpdate,
		};
	}

	public load(entity: EntityUpdate) {
		if (entity.pos !== undefined)
			this.position = Vector.fromObject(entity.pos);
		if (entity.rot !== undefined)
			this.rotation = Quaternion.fromObject(entity.rot);
		if (entity.lv !== undefined)
			this.linearVelocity = Vector.fromObject(entity.lv);
		if (entity.av !== undefined)
			this.angularVelocity = Vector.fromObject(entity.av);
		if (entity.tp !== undefined)
			this.targetPosition = entity.tp ? Vector.fromObject(entity.tp) : null;
		if (entity.tr !== undefined)
			this.targetRotation = entity.tr ? Quaternion.fromObject(entity.tr) : null;
		if (entity.lu !== undefined)
			this.lastUpdate = entity.lu;
	}

	public destroy() {
		Ammo.destroy(this.physicsObject.getCollisionShape());
		Ammo.destroy(this.physicsObject.getMotionState());
		Ammo.destroy(this.physicsObject);
	}

	public onCollision(other: Entity | null, p0: Vector, p1: Vector) {
	}
}

export function createPhysicsObject(collisionShape: Ammo.btCollisionShape, mass: number): Ammo.btRigidBody {
	const transform = new Ammo.btTransform();
	transform.setIdentity();
	const motionState = new Ammo.btDefaultMotionState();
	const localInertia = new Ammo.btVector3(0, 0, 0);
	collisionShape.calculateLocalInertia(mass, localInertia);
	const info = new Ammo.btRigidBodyConstructionInfo(mass, motionState, collisionShape, localInertia);
	const physicsObject = new Ammo.btRigidBody(info);
	physicsObject.setWorldTransform(transform);
	physicsObject.setActivationState(4);
	Ammo.destroy(transform);
	Ammo.destroy(localInertia);
	Ammo.destroy(info);
	return physicsObject;
}
