import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

function createGlLoader() {
    const glLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/examples/jsm/libs/draco');
    glLoader.setDRACOLoader(dracoLoader);

    return glLoader;
}

export { createGlLoader };