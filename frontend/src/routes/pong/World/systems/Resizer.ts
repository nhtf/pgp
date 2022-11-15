import type {
    PerspectiveCamera as Camera,
    Scene,
    WebGLRenderer,
} from 'three';


class Resizer {
    constructor(container: Element | null, camera: Camera, renderer: WebGLRenderer) {
        if (container)
            this.setSize(container, camera, renderer);
    }

    setSize(container: Element | null, camera: Camera, renderer: WebGLRenderer) {
        if (container === null)
            return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        this.onResize();
    }

    onResize() { }
}

export { Resizer };