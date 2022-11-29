import { 
    SphereGeometry, 
    MeshStandardMaterial
} from 'three';

import { Entity } from '../Systems/entity';
import { Ammo } from '../Systems/ammo';
import { Vector, Quaternion } from '../Systems/math';
import { Mesh, FrontSide } from 'three';
import type { World } from "../Systems/world";
import { ballId } from './vars';

export class Ball extends Entity {

	constructor(world: World) {
		const sphereRadius = 0.02;
		const sphereGeometry = new SphereGeometry(sphereRadius);
		const sphereMaterial = new MeshStandardMaterial({ color: 'white', side:  FrontSide});
		const sphereShape = new Ammo.btSphereShape(sphereRadius);
		const sphereMesh = new Mesh(sphereGeometry, sphereMaterial);
		sphereMesh.castShadow = true;
		super(world, sphereMesh, sphereShape, 0.0027, new Vector(-1.1, 0.79, 0), new Quaternion(0, 0, 0, 1), true);
		this.physicsObject.setRestitution(0.9);
		this.physicsObject.setDamping(0, 0.99); //so the ball doesn't roll as far
		this.physicsObject.setUserIndex(ballId); //For checking with what the ball collides with
		this.physicsObject.setActivationState(4); //DISABLE DEACTIVATION
		let gravity = new Ammo.btVector3(0, 0, 0);
		this.physicsObject.setGravity(gravity);
		this.physicsObject.applyGravity();
		this.physicsObject.activate();
		Ammo.destroy(gravity);
		console.log(this.physicsObject.getGravity().y());
	}

	tick() {
		let gravity = new Ammo.btVector3(0, -9.81, 0);
		this.physicsObject.setGravity(gravity);
		this.physicsObject.applyGravity();
		this.physicsObject.activate();
		Ammo.destroy(gravity);
	}
}
