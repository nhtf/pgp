import { Clock, Vector3 } from 'three';

import type {
    Camera,
    Scene,
    WebGLRenderer,
} from 'three';

type movement = {
    mouseMovementX: number;
    mouseMovementY: number;
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    moveSpeed: number;
};

const clock = new Clock();

class Loop {
    private camera: Camera;
    private scene: Scene;
    private renderer: WebGLRenderer;
    private mov: movement;
    private lon: number;
    private lat: number;
    private phi: number;
    private theta: number;
    private target: Vector3;
    updatables: any;

    constructor(camera: Camera, scene: Scene, renderer: WebGLRenderer, mov: movement) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.updatables = [];
        this.mov = mov;
        this.lon = 0;
        this.lat = 0;
        this.phi = 0;
        this.theta = 0;
        this.target = new Vector3;
    }

    start() {
        this.renderer.setAnimationLoop(() => {
            //tell animated objects to tick forward one frame
            this.tick();

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

        for (const object of this.updatables) {
            object.tick(delta);
        }

        if(this.mov.moveForward) this.camera.translateZ(-(this.mov.moveSpeed));
        if(this.mov.moveBackward) this.camera.translateZ(this.mov.moveSpeed);

        if(this.mov.moveLeft) this.camera.translateX(-this.mov.moveSpeed);
        if(this.mov.moveRight) this.camera.translateX(this.mov.moveSpeed);

        this.lon += this.mov.mouseMovementX;
        this.lat -= this.mov.mouseMovementY;

        this.mov.mouseMovementX = 0;
        this.mov.mouseMovementY = 0;

        this.phi = (90 - this.lat) * Math.PI / 180;
        this.theta = this.lon * Math.PI / 180;

        this.target.x = this.camera.position.x + 100 * Math.sin(this.phi) * Math.cos(this.theta);
        this.target.y = this.camera.position.y + 100 * Math.cos(this.phi)
        this.target.z = this.camera.position.z + 100 * Math.sin(this.phi) * Math.sin(this.theta);
        this.camera.lookAt(this.target);
    }
}

export { Loop }