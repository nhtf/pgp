import { 
    SphereGeometry, 
    MeshStandardMaterial
} from 'three';

import { Entity } from '../Systems/entity';
import { Ammo } from '../Systems/ammo';
import { Vector, Quaternion } from '../Systems/math';
import { Mesh, FrontSide } from 'three';
import type { World } from "../Systems/world";

const tableId = 2;
const floorId = 3;
const ballId = 1;

export class Ball extends Entity {
	private lastHit: number;

	constructor(world: World) {
		const sphereRadius = 0.02;
		const sphereGeometry = new SphereGeometry(sphereRadius);
		const sphereMaterial = new MeshStandardMaterial({ color: 'white', side:  FrontSide});
		const sphereShape = new Ammo.btSphereShape(sphereRadius);
		const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
		sphereMesh.castShadow = true;
		super(world, sphereMesh, sphereShape, 0.0027, new Vector(-1.1, 0.79, 0), new Quaternion(0, 0, 0, 1), true);
		this.lastHit = 0;
		this.physicsObject.setRestitution(0.9);
		this.physicsObject.setDamping(0, 0.99); //so the ball doesn't roll as far
		this.physicsObject.setUserIndex(ballId); //For checking with what the ball collides (floor is 69, and racket gets their id set by backend)
	}

	tick() {
		if (this.physicsObject.isActive()) {
			const numManiFolds = this.world.world.getDispatcher().getNumManifolds();
			for (let i = 0; i < numManiFolds; i++ ) {
				let conctactManifold = this.world.world.getDispatcher().getManifoldByIndexInternal(i);
				let obA = conctactManifold.getBody0();
				let obB = conctactManifold.getBody1();
				// if (obA.getUserIndex() !== ballId && obB.getUserIndex() !== ballId)
				// 	break;

				let numContacts = conctactManifold.getNumContacts();
				for (let j = 0; j < numContacts; j++) {
					let pt = conctactManifold.getContactPoint(j);
					// console.log(pt.getDistance());
					if (pt.getDistance() < 0.1) {
						if (obA.getUserIndex() !== 0 && obB.getUserIndex() !== 0) {
							if (obA.getUserIndex() > floorId)
								this.lastHit = obA.getUserIndex();
							else if (obB.getUserIndex() > floorId)
								this.lastHit = obB.getUserIndex();
							console.log("collision obA: ", obA.getUserIndex(), " obB: ", obB.getUserIndex());
							// if (obA.getUserIndex() === floorId || obB.getUserIndex() === floorId) {
							// 	console.log("ball hit floor");
							// }
							// else if (obA.getUserIndex() === tableId || obB.getUserIndex() === tableId) {
							// 	console.log("ball hit table");
							// }
							// else {
							// 	console.log("ball hit racket/ something else");
							// }
							let ptA = Vector.fromAmmo(pt.getPositionWorldOnA());
							// console.log("collison pos: ", ptA);
						
					}
				}
			}
		}
	}
}
}
