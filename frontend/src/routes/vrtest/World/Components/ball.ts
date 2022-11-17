import { 
    SphereGeometry, 
    MeshStandardMaterial
} from 'three';

import { Entity } from '../Systems/entity';
import { Ammo } from '../Systems/ammo';
import { Vector, Quaternion } from '../Systems/math';
import { Mesh, DoubleSide } from 'three';

export class Ball extends Entity {
	constructor() {
		const sphereRadius = 0.02;
		const sphereGeometry = new SphereGeometry(sphereRadius);
		const sphereMaterial = new MeshStandardMaterial({ color: 'white', side:  DoubleSide});
		const sphereShape = new Ammo.btSphereShape(sphereRadius);
		const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
		super(sphereMesh, sphereShape, 0.0027, new Vector(0, 0.5, 0), new Quaternion(0, 0, 0, 1), true);
		this.physicsObject.setRestitution(0.9);
		this.physicsObject.setDamping(0, 0.99); //so the ball doesn't roll as far
	}
}
