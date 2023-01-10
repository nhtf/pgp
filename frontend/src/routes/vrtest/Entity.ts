import { Ammo } from "./Ammo";
import { Vector, Quaternion } from "./Math";
import type { VectorObject, QuaternionObject } from "./Math";
import type { World } from "./World";
import type * as THREE from "three";

export interface EntityObject {
	uuid: string;
	name: string;
	position: VectorObject;
	rotation: QuaternionObject;
	linearVelocity: VectorObject;
	angularVelocity: VectorObject;
	targetPosition: VectorObject | null;
	targetRotation: QuaternionObject | null;
}

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
			let position = Vector.fromObject(this.targetPosition);
			this.linearVelocity = position.sub(this.position).scale(50);
		}

		if (this.targetRotation !== null) {
			let rotation = Quaternion.fromObject(this.targetRotation);
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
			position: this.position.intoObject(),
			rotation: this.rotation.intoObject(),
			linearVelocity: this.linearVelocity.intoObject(),
			angularVelocity: this.angularVelocity.intoObject(),
			targetPosition: this.targetPosition ? this.targetPosition.intoObject() : null,
			targetRotation: this.targetRotation ? this.targetRotation.intoObject() : null,
		};
	}

	public load(entity: EntityObject) {
		this.position = Vector.fromObject(entity.position);
		this.rotation = Quaternion.fromObject(entity.rotation);
		this.linearVelocity = Vector.fromObject(entity.linearVelocity);
		this.angularVelocity = Vector.fromObject(entity.angularVelocity);
		this.targetPosition = entity.targetPosition ? Vector.fromObject(entity.targetPosition) : null;
		this.targetRotation = entity.targetRotation ? Quaternion.fromObject(entity.targetRotation) : null;
	}

	public destroy() {
		Ammo.destroy(this.physicsObject.getCollisionShape());
		Ammo.destroy(this.physicsObject.getMotionState());
		Ammo.destroy(this.physicsObject);
	}

	public onCollision(other: Entity | null, p0: Vector, p1: Vector) {
	}
}

export function createPhysicsObject(collisionShape: Ammo.btCollisionShape, mass: number) {
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
