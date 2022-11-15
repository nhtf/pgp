import { Ammo } from "./ammo";
import { Vector, Quaternion } from "./math";
import type { VectorObject, QuaternionObject } from "./math";
import * as THREE from "three";

export interface EntityObject {
	position: VectorObject;
	rotation: QuaternionObject;
	linearVelocity: VectorObject;
	angularVelocity: VectorObject;
}

export class Entity {
	renderObject: THREE.Mesh;
	physicsObject: Ammo.btRigidBody;

	constructor(geometry: THREE.BufferGeometry, material: THREE.Material, shape: Ammo.btCollisionShape, mass: number, position: Vector, rotation: Quaternion) {
		this.renderObject = new THREE.Mesh(geometry, material);
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(position.intoAmmo());
		transform.setRotation(rotation.intoAmmo());
		const motionState = new Ammo.btDefaultMotionState();
		const localInertia = new Ammo.btVector3(0, 0, 0);
		shape.calculateLocalInertia(mass, localInertia);
		const info = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		this.physicsObject = new Ammo.btRigidBody(info);
	}

	private get ammoTransform(): Ammo.btTransform {
		const transform = new Ammo.btTransform();
		this.physicsObject.getMotionState().getWorldTransform(transform);
		return transform;
	}

	private set ammoTransform(transform: Ammo.btTransform) {
		this.physicsObject.getMotionState().setWorldTransform(transform);
	}

	get position(): Vector {
		return Vector.fromAmmo(this.ammoTransform.getOrigin());
	}

	get rotation(): Quaternion {
		return Quaternion.fromAmmo(this.ammoTransform.getRotation());
	}

	get linearVelocity(): Vector {
		return Vector.fromAmmo(this.physicsObject.getLinearVelocity());
	}

	get angularVelocity(): Vector {
		return Vector.fromAmmo(this.physicsObject.getAngularVelocity());
	}

	set position(vector: Vector) {
		const transform = this.ammoTransform;
		transform.setOrigin(vector.intoAmmo());
		this.ammoTransform = transform;
	}

	set rotation(quaternion: Quaternion) {
		const transform = this.ammoTransform;
		transform.setRotation(quaternion.intoAmmo());
		this.ammoTransform = transform;
	}

	set linearVelocity(vector: Vector) {
		this.physicsObject.setLinearVelocity(vector.intoAmmo());
	}

	set angularVelocity(vector: Vector) {
		this.physicsObject.setAngularVelocity(vector.intoAmmo());
	}

	tick() {}

	update() {
		this.renderObject.position.copy(this.position.intoThree());
		this.renderObject.quaternion.copy(this.rotation.intoThree());
	}

	serialize(): EntityObject {
		return {
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
