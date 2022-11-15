import type {
    Camera,
    Scene,
    WebGLRenderer,
    Mesh
} from 'three';

import { Ammo } from '../Systems/ammo';

import { Clock } from 'three';
import { objects } from '../World';

const clock = new Clock();

let previousTime: number;

class Loop {
    private camera: Camera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private socket: any;
    private world: Ammo.btDiscreteDynamicsWorld;
    private objects: Mesh[];

    constructor(camera: Camera, scene: Scene, renderer: WebGLRenderer, socket: any, world: Ammo.btDiscreteDynamicsWorld, objects: Mesh[]) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.objects = objects;
        this.socket = socket;
        this.world = world;
    }

    start() {
        this.renderer.setAnimationLoop((currentTime) => {

            if (previousTime !== undefined) {
				const deltaTime = currentTime - previousTime;
				this.world.stepSimulation(deltaTime / 1000, 30, 1 / 1000);
			}

            //tell animated objects to tick forward one frame
            this.tick();

            previousTime = currentTime;
            // render a frame
            this.renderer.render(this.scene, this.camera);
        });
    }

    stop() {
        this.renderer.setAnimationLoop(null);
    }

    tick() {
        //Calling getDelta to be able decouple animation speed from framerate
        // by using the deltattime
        const delta = clock.getDelta();
        // console.log(
        //   `The last frame rendered in ${delta * 1000} milliseconds`,
        // );

        // for (const object of this.updatables) {
        //     object.tick(delta);
        // }

        objects.forEach((obj) => {
            const transform = new Ammo.btTransform();
            obj.userData.rigidBody.getMotionState().getWorldTransform(transform);
            const origin = transform.getOrigin();
            const rotation = transform.getRotation();
            obj.position.set(origin.x(), origin.y(), origin.z());
            obj.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        });

        if (this.renderer.xr.isPresenting) {
            console.log("sending vr camera to backend");
            this.socket.emit('moveEvent', this.renderer.xr.getCamera().position, this.renderer.xr.getCamera().rotation);
        }        
    }
}

export { Loop }