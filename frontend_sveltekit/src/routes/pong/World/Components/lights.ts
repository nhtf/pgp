import {
    DirectionalLight,
    AmbientLight,
    HemisphereLight,
    SpotLight,
    PointLight,
} from 'three';

function createLights() {
    // const light = new PointLight('white', 350, 0, 1.9);
    const light = new SpotLight('white', 350, 0, Math.PI * 0.45, 0.0, 2);
    const ambient = new AmbientLight('white', 0.5);

    light.position.y = 9;
    light.castShadow = true;

    return { light, ambient };
}

export { createLights };