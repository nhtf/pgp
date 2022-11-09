import type {
    PerspectiveCamera as Camera,
    Scene,
    WebGLRenderer,
} from 'three';


class Resizer {
    constructor(container: Element, camera: Camera, renderer: WebGLRenderer) {

        this.setSize(container, camera, renderer);
    }

    setSize(container: Element, camera: Camera, renderer: WebGLRenderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        this.onResize();
    }

    onResize() { }
}

export { Resizer };