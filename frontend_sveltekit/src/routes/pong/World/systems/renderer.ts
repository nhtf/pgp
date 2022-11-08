import { WebGLRenderer, PCFSoftShadowMap} from 'three';

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });

    renderer.physicallyCorrectLights = true;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap; 

    // renderer.setAnimationLoop(() => {
    //     renderer.render(scene, camera);
    // });
    return renderer;
}

export { createRenderer };