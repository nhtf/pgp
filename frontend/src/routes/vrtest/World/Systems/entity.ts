import { Ammo } from "./ammo";
import { Vector, Quaternion } from "./math";
import type { VectorObject, QuaternionObject } from "./math";
import type { World } from "./world";
import * as THREE from "three";

export interface EntityObject {
	name: string;
	position: VectorObject;
	rotation: QuaternionObject;
	linearVelocity: VectorObject;
	angularVelocity: VectorObject;
}

export class Entity {
	renderObject: THREE.Object3D;
	physicsObject: Ammo.btRigidBody;
	updatePosition: boolean;
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
		const vector = Vector.fromAmmo(ammoVector);
		Ammo.destroy(transform);
		Ammo.destroy(ammoVector);
		return vector;
	}

	get rotation(): Quaternion {
		const transform = this.physicsObject.getWorldTransform();
		const ammoQuaternion = transform.getRotation();
		const quaternion = Quaternion.fromAmmo(ammoQuaternion);
		Ammo.destroy(transform);
		Ammo.destroy(ammoQuaternion);
		return quaternion;
	}

	get linearVelocity(): Vector {
		const ammoVector = this.physicsObject.getLinearVelocity();
		const vector = Vector.fromAmmo(ammoVector);
		Ammo.destroy(ammoVector);
		return vector;
	}

	get angularVelocity(): Vector {
		const ammoVector = this.physicsObject.getAngularVelocity();
		const vector = Vector.fromAmmo(ammoVector);
		Ammo.destroy(ammoVector);
		return vector;
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

	tick() {}

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
		};
	}

	deserialize(entity: EntityObject) {
		this.position = Vector.fromObject(entity.position);
		this.rotation = Quaternion.fromObject(entity.rotation);
		this.linearVelocity = Vector.fromObject(entity.linearVelocity);
		this.angularVelocity = Vector.fromObject(entity.angularVelocity);
	}
}
