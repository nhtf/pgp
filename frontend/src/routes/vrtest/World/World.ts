import { Ammo } from './Systems/ammo';
import { Mesh } from 'three';
import type { MeshStandardMaterial, BufferGeometry, Scene } from 'three';
import { createGlLoader } from './Systems/ModelLoader';


let world: Ammo.btDiscreteDynamicsWorld;
let glLoader = createGlLoader();
const objects: Mesh[] = [];

function createObject(geometry: BufferGeometry, material: MeshStandardMaterial, shape: Ammo.btSphereShape, mass: number, position: number[], rotation: number[]) {
    const obj = new Mesh(geometry, material);
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position[0], position[1], position[2]));
    transform.setRotation(new Ammo.btQuaternion(rotation[0], rotation[1], rotation[2], rotation[3]));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);
    const rigidBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia));
    obj.userData.rigidBody = rigidBody;
    world.addRigidBody(rigidBody);
    // scene.add(obj);
    objects.push(obj);
    return rigidBody;
}

function createWorld() {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const collisionDispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const broadphase = new Ammo.btDbvtBroadphase();
    const constraintSolver = new Ammo.btSequentialImpulseConstraintSolver();
    world = new Ammo.btDiscreteDynamicsWorld(collisionDispatcher, broadphase, constraintSolver, collisionConfiguration);
    world.setGravity(new Ammo.btVector3(0, -9.81, 0));

    return world;
}

function loadModel(path: string, name: string,scene: Scene, scale: number, rigidBody: Ammo.btRigidBody) {
    glLoader.load(path,
        function (gltf) {
            gltf.scene.name = name;
            console.log(gltf.scene.children[3]);
            gltf.scene.scale.set(scale * gltf.scene.scale.x, scale * gltf.scene.scale.y, scale * gltf.scene.scale.z);
            gltf.scene.castShadow = true;
            const transform = new Ammo.btTransform();
            rigidBody.getMotionState().getWorldTransform(transform);
            const position = transform.getOrigin();
            // console.log(position);
            gltf.scene.position.set(position.x(), position.y(), position.z());
            // console.log(gltf.scene.position);
            scene.add(gltf.scene);
            gltf.animations;
            gltf.scene;
            gltf.scenes;
            gltf.cameras;
            gltf.asset;
        },
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        function (error) {
            console.log('An error happened.');
        });
}

export { createWorld };
export { objects } ;
export { createObject };
export { loadModel };