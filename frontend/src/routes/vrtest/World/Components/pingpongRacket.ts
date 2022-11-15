import { createObject } from '../World';
import { CylinderGeometry, MeshStandardMaterial } from 'three';
import { Ammo } from '../Systems/ammo';
import type {XRTargetRaySpace} from 'three';
import { Vector, Quaternion } from '../Systems/math';
import { Entity } from '../Systems/entity';


export class Racket extends Entity {

    controller: XRTargetRaySpace;

    constructor(controller: XRTargetRaySpace) {
        
        const cylinderRadius = 0.085;
        const cylinderHeight = 0.015;
        const cylinderGeometry = new CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 64);
        const cylinderMaterial = new MeshStandardMaterial({ color: 0xff0000 });
        const cylinderShape = new Ammo.btCylinderShape(new Ammo.btVector3(cylinderRadius, cylinderHeight / 2, cylinderRadius));

        super(cylinderGeometry, cylinderMaterial, cylinderShape, 0.1, new Vector(0, 0, 0), new Quaternion(0, 0, 0, 1));
        this.physicsObject.setRestitution(0.7);
        this.controller = controller;
    }

    tick() {
        let position = Vector.fromThree(this.controller.position);
        position = position.sub(this.position).scale(60);
        let rotation = Quaternion.fromThree(this.controller.quaternion);
        rotation = rotation.mul(this.rotation)
        this.angularVelocity = rotation.euler().scale(50);
        this.linearVelocity = position;
        this.physicsObject.activate();
        // scene.getObjectByName('racket')?.position.set(controller.right.position.x, controller.right.position.y, controller.right.position.z);
        // scene.getObjectByName('racket')?.rotation.set(controller.right.rotation.x, controller.right.rotation.y, controller.right.rotation.z);
    }
}