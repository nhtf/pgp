import {
    AmbientLight,
    HemisphereLight,
    SpotLight,
    PointLight,
} from 'three';

function createLights() {
    const light = new SpotLight('white', 450, 0, Math.PI * 0.45, 0.0, 2);
    const pointLight = new PointLight('white', 50, 0, 2);
    const ambient = new AmbientLight('white', 0.5);
    const hemisphere = new HemisphereLight(0xffffff, 'grey', 1.0);

    light.position.y = 19;
    pointLight.position.y = 4;
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;//Check the size of these for performance
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 20;

    return { light, ambient, hemisphere, pointLight };
}

export { createLights };