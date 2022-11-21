import type { CylinderGeometry, MeshStandardMaterial, Object3D, Mesh } from 'three';
import { Ammo } from '../Systems/ammo';
import type { XRTargetRaySpace } from 'three';
import { Vector, Quaternion } from '../Systems/math';
import { Entity } from '../Systems/entity';
import { createShape } from '../Systems/ModelLoader';

export class Racket extends Entity {
	controller: XRTargetRaySpace;

	constructor(controller: XRTargetRaySpace, mesh: Object3D) {
		const cylinderShape = createShape(mesh.children[0]);
		console.log(cylinderShape.getMargin());
		super(mesh, cylinderShape, 0.25, new Vector(0, 0, 0), new Quaternion(0, 0, 0, 1), true);
		this.physicsObject.setRestitution(0.7);
		this.controller = controller;
	}

	tick() {
		let position = Vector.fromThree(this.controller.position);
		position = position.sub(this.position).scale(50);
		let rotation = Quaternion.fromThree(this.controller.quaternion);
		rotation = rotation.mul(this.rotation.inverse())
		this.angularVelocity = rotation.euler().scale(50);
		this.linearVelocity = position;
		this.physicsObject.activate();
	}
}
