import { Clock } from 'three';

const clock = new Clock();

class Loop {
    private camera: any;
    private scene: any;
    private renderer: any;
    private updatables: any;

    constructor(camera, scene, renderer) {
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.updatables = [];
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
    }
}

export { Loop }