import { PerspectiveCamera } from 'three';

function createCamera() {
    const camera = new PerspectiveCamera(
        35, //fov
        1, //aspect ratio (dummy value)
        0.1, //near clipping plane
        1000, //far clipping plane
    );

    camera.position.set(5, 5, 5);

    // camera.tick = (delta) => {
    //     // camera.position.z += delta;
    //     camera.rotation.y += delta * 1;
    //     camera.rotation.x += delta * 1;
    //     camera.rotation.z += delta * 1;

    //     // cube.position.x += delta;
    // }

    return camera;
}

export { createCamera }