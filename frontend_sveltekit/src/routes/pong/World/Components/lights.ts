import { 
    DirectionalLight,
    AmbientLight,
    HemisphereLight,
    SpotLight,
    PointLight,
} from 'three';

function createLights() {
    const light = new PointLight('white', 45);

    light.position.y = 10;
    light.castShadow = true;
    
    return { light };
}
    
export { createLights };