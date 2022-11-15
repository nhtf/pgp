import { PerspectiveCamera } from 'three';

function createCamera() {
    const camera = new PerspectiveCamera(
        90, //fov
        1, //aspect ratio (dummy value)
        0.1, //near clipping plane
        1000, //far clipping plane
    );

    camera.position.set(0, 1.8, 0);

    return camera;
}

export { createCamera }