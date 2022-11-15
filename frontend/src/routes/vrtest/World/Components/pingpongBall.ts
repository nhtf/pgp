import { 
    SphereGeometry, 
    MeshStandardMaterial
} from 'three';

import { createObject } from '../World';

import { Ammo } from '../Systems/ammo';

function createPingPongBall() {

    const sphereRadius = 0.02;
    const sphereGeometry = new SphereGeometry(sphereRadius);
    const sphereMaterial = new MeshStandardMaterial({ color: 0xffffff });
    const sphereShape = new Ammo.btSphereShape(sphereRadius);
    const pongBall = createObject(sphereGeometry, sphereMaterial, sphereShape, 0.0027, [0, 0.5, 0], [0, 0, 0, 1]);
    pongBall.setRestitution(0.9);

    return pongBall;
}

export { createPingPongBall };