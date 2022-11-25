import type {  Object3D } from "three";
import { Ammo } from "../Systems/ammo";
import { Vector, Quaternion } from "../Systems/math";
import { Entity } from "../Systems/entity";
import { createShape } from "../Systems/ModelLoader";
import type { World } from "../Systems/world";

export class Racket extends Entity {
	controller: Object3D | undefined;

	constructor(world: World, controller: Object3D | undefined, mesh: Object3D, id: number) {
		const cylinderShape = createShape(mesh.children[0]);
		mesh.castShadow = true;
		super(world, mesh, cylinderShape, 0.25, new Vector(0, 1, 0), new Quaternion(0, 0, 0, 1), true);
		this.physicsObject.setRestitution(0.7);
		this.physicsObject.setUserIndex(id);
		console.log("id racket: ", id);
		this.controller = controller;
	}

	tick() {
		if (this.controller !== undefined) {
			// if (this.physicsObject.isActive())
			// 	console.log("paddle pos active: ", this.position);
			let position = Vector.fromThree(this.controller.getWorldPosition(this.controller.position));
			position = position.sub(this.position).scale(50);
			let rotation = Quaternion.fromThree(this.controller.getWorldQuaternion(this.controller.quaternion));
			rotation = rotation.mul(this.rotation.inverse());
			this.world.createEvent({
				target: this.name ?? "",
				position: this.position,
				rotation: this.rotation,
				linearVelocity: position,
				angularVelocity: rotation.euler().scale(50),
			});
			this.physicsObject.activate();
		}
	}
}
