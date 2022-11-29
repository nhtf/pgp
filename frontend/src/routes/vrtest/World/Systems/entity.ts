import { Ammo } from "./ammo";
import { Vector, Quaternion } from "./math";
import type { VectorObject, QuaternionObject } from "./math";
import type { World } from "./world";
import * as THREE from "three";

export interface EntityTransform {
	position: VectorObject;
	rotation: QuaternionObject;
}

export interface EntityObject {
	name: string;
	position: VectorObject;
	rotation: QuaternionObject;
	linearVelocity: VectorObject;
	angularVelocity: VectorObject;
	target: EntityTransform | null;
}

export class Entity {
	renderObject: THREE.Object3D;
	physicsObject: Ammo.btRigidBody;
	updatePosition: boolean;
	target: EntityTransform | null = null;
	name: string | null = null;
	world: World;

	constructor(world: World, mesh: THREE.Object3D, shape: Ammo.btCollisionShape, mass: number, position: Vector, rotation: Quaternion, update: boolean) {
		this.world = world;
		this.renderObject = mesh;
		this.updatePosition = update;
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(position.intoAmmo());
		transform.setRotation(rotation.intoAmmo());
		const motionState = new Ammo.btDefaultMotionState();
		const localInertia = new Ammo.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, localInertia);
		const info = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		// info.set_m_linearSleepingThreshold(100);
		this.physicsObject = new Ammo.btRigidBody(info);
		this.physicsObject.setWorldTransform(transform);
		Ammo.destroy(transform);
	}

	static create(world: World, geometry: THREE.BufferGeometry, material: THREE.Material, shape: Ammo.btCollisionShape, mass: number, position: Vector, rotation: Quaternion) {
		return new Entity(world, new THREE.Mesh(geometry, material), shape, mass, position, rotation, true);
	}

	get position(): Vector {
		const transform = this.physicsObject.getWorldTransform();
		const ammoVector = transform.getOrigin();
		const vector = Vector.moveFromAmmo(ammoVector);
		Ammo.destroy(transform);
		return vector;
	}

	get rotation(): Quaternion {
		const transform = this.physicsObject.getWorldTransform();
		const ammoQuaternion = transform.getRotation();
		const quaternion = Quaternion.moveFromAmmo(ammoQuaternion);
		Ammo.destroy(transform);
		return quaternion;
	}

	get linearVelocity(): Vector {
		return Vector.moveFromAmmo(this.physicsObject.getLinearVelocity());
	}

	get angularVelocity(): Vector {
		return Vector.moveFromAmmo(this.physicsObject.getAngularVelocity());
	}

	set position(vector: Vector) {
		const transform = this.physicsObject.getWorldTransform();
		const ammoVector = vector.intoAmmo();
		transform.setOrigin(ammoVector);
		this.physicsObject.setWorldTransform(transform);
		Ammo.destroy(transform);
		Ammo.destroy(ammoVector);
	}

	set rotation(quaternion: Quaternion) {
		const transform = this.physicsObject.getWorldTransform();
		const ammoQuaternion = quaternion.intoAmmo();
		transform.setRotation(ammoQuaternion);
		this.physicsObject.setWorldTransform(transform);
		Ammo.destroy(transform);
		Ammo.destroy(ammoQuaternion);
	}

	set linearVelocity(vector: Vector) {
		const ammoVector = vector.intoAmmo();
		this.physicsObject.setLinearVelocity(ammoVector);
		Ammo.destroy(ammoVector);
	}

	set angularVelocity(vector: Vector) {
		const ammoVector = vector.intoAmmo();
		this.physicsObject.setAngularVelocity(ammoVector);
		Ammo.destroy(ammoVector);
	}

	tick(deltaTime: number) {}

	postTick(deltaTime: number) {
		if (this.target !== null) {
			let position = Vector.fromObject(this.target.position);
			this.linearVelocity = position.sub(this.position).scale(50);
			let rotation = Quaternion.fromObject(this.target.rotation);
			this.angularVelocity = rotation.mul(this.rotation.inverse()).euler().scale(50);
		}
		this.physicsObject.activate();
	}

	update() {
		if (this.updatePosition) {
			this.renderObject.position.copy(this.position.intoThree());
			this.renderObject.quaternion.copy(this.rotation.intoThree());
		}
	}

	serialize(): EntityObject {
		return {
			name: this.name ?? "",
			position: this.position.intoObject(),
			rotation: this.rotation.intoObject(),
			linearVelocity: this.linearVelocity.intoObject(),
			angularVelocity: this.angularVelocity.intoObject(),
			target: this.target,
		};
	}

	deserialize(entity: EntityObject) {
		this.position = Vector.fromObject(entity.position);
		this.rotation = Quaternion.fromObject(entity.rotation);
		this.linearVelocity = Vector.fromObject(entity.linearVelocity);
		this.angularVelocity = Vector.fromObject(entity.angularVelocity);
		this.target = entity.target;
	}
}
