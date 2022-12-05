import type {  Object3D } from "three";
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
		this.physicsObject.setUserIndex(id + 42);
		if (id === undefined)
			this.physicsObject.setUserIndex(42);
		console.log("id racket: ", id + 42);
		this.controller = controller;
	}

	tick() {
		if (this.controller !== undefined) {
			let position = Vector.fromThree(this.controller.getWorldPosition(this.controller.position));
			let rotation = Quaternion.fromThree(this.controller.getWorldQuaternion(this.controller.quaternion));
			this.world.createEvent({
				type: "target",
				target: this.name ?? "",
				data: { position, rotation },
			});
		}
	}
}
