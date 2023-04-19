import { Ammo } from "./Ammo";
import { Vector, Quaternion } from "../Math";
import type { VectorObject, QuaternionObject } from "../Math";
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
	public interpolation: number;

	public constructor(world: World, uuid: string, renderObject: THREE.Object3D, physicsObject: Ammo.btRigidBody) {
		this.world = world;
		this.uuid = uuid;
		this.renderObject = renderObject;
		this.physicsObject = physicsObject;
		this.targetPosition = null;
		this.targetRotation = null;
		this.lastUpdate = 0;
		this.removed = false;
		this.interpolation = 1;
	}

	public get position(): Vector {
		const motionState = this.physicsObject.getMotionState();
		const worldTransform = new Ammo.btTransform();
		motionState.getWorldTransform(worldTransform);
		const origin = Vector.fromAmmo(worldTransform.getOrigin());
		Ammo.destroy(worldTransform);
		return origin;
	}

	public get rotation(): Quaternion {
		const motionState = this.physicsObject.getMotionState();
		const worldTransform = new Ammo.btTransform();
		motionState.getWorldTransform(worldTransform);
		const rotation = Quaternion.fromAmmo(worldTransform.getRotation());
		Ammo.destroy(worldTransform);
		return rotation;
	}

	public get linearVelocity(): Vector {
		return Vector.fromAmmo(this.physicsObject.getLinearVelocity());
	}

	public get angularVelocity(): Vector {
		return Vector.fromAmmo(this.physicsObject.getAngularVelocity());
	}

	public set position(vector: Vector) {
		const motionState = this.physicsObject.getMotionState();
		const worldTransform = new Ammo.btTransform();
		motionState.getWorldTransform(worldTransform);
		const origin = new Ammo.btVector3(vector.x, vector.y, vector.z);
		worldTransform.setOrigin(origin);
		motionState.setWorldTransform(worldTransform);
		this.physicsObject.setMotionState(motionState);
		Ammo.destroy(origin);
		Ammo.destroy(worldTransform);
	}

	public set rotation(quaternion: Quaternion) {
		const motionState = this.physicsObject.getMotionState();
		const worldTransform = new Ammo.btTransform();
		motionState.getWorldTransform(worldTransform);
		const rotation = new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
		worldTransform.setRotation(rotation);
		motionState.setWorldTransform(worldTransform);
		this.physicsObject.setMotionState(motionState);
		Ammo.destroy(rotation);
		Ammo.destroy(worldTransform);
	}

	public set linearVelocity(vector: Vector) {
		const linearVelocity = new Ammo.btVector3(vector.x, vector.y, vector.z);
		this.physicsObject.setLinearVelocity(linearVelocity);
		Ammo.destroy(linearVelocity);
	}

	public set angularVelocity(vector: Vector) {
		const angularVelocity = new Ammo.btVector3(vector.x, vector.y, vector.z);
		this.physicsObject.setAngularVelocity(angularVelocity);
		Ammo.destroy(angularVelocity);
	}

	public motionStateIntoObject(): object {
		return this.save();
		/*
		const buffer = new Float32Array(13);
		const position = this.position;
		const rotation = this.rotation;
		const linearVelocity = this.linearVelocity;
		const angularVelocity = this.angularVelocity;

		buffer[0] = position.x;
		buffer[1] = position.y;
		buffer[2] = position.z;
		buffer[3] = rotation.x;
		buffer[4] = rotation.y;
		buffer[5] = rotation.z;
		buffer[6] = rotation.w;
		buffer[7] = linearVelocity.x;
		buffer[8] = linearVelocity.y;
		buffer[9] = linearVelocity.z;
		buffer[10] = angularVelocity.x;
		buffer[11] = angularVelocity.y;
		buffer[12] = angularVelocity.z;

		return serialize(buffer.buffer);
		*/
	}

	public motionStateFromObject(obj: object) {
		this.load(obj);
		/*
		const buffer = new Float32Array(deserialize(obj));
		this.position = new Vector(buffer[0], buffer[1], buffer[2]);
		this.rotation = new Quaternion(buffer[3], buffer[4], buffer[5], buffer[6]);
		this.linearVelocity = new Vector(buffer[7], buffer[8], buffer[9]);
		this.angularVelocity = new Vector(buffer[10], buffer[11], buffer[12]);
		*/
	}

	public physicsTick() {
		if (this.targetPosition !== null) {
			const position = this.targetPosition;
			this.linearVelocity = position.sub(this.position).scale(50);
		}

		if (this.targetRotation !== null) {
			const rotation = this.targetRotation;
			this.angularVelocity = rotation.mul(this.rotation.inverse()).euler().scale(50);
		}
	}

	public earlyTick() {
	}

	public lateTick() {
	}

	public clientTick() {
		this.renderObject.position.lerp(this.position.intoThree(), this.interpolation);
		this.renderObject.quaternion.slerp(this.rotation.intoThree(), this.interpolation);
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
