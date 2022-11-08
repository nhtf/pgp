import { 
    TorusGeometry,
    BoxGeometry,
    Mesh, 
    MeshToonMaterial,
    SphereGeometry,
    MeshStandardMaterial,
    MathUtils,
    TextureLoader,
    UVMapping,
    CubeReflectionMapping,
    CubeRefractionMapping,
    EquirectangularReflectionMapping,
    EquirectangularRefractionMapping,
    CubeUVReflectionMapping,
    RepeatWrapping,
    ClampToEdgeWrapping,
    MirroredRepeatWrapping,
    Vector2,
    BackSide,
    DoubleSide,
} from 'three';

function setMaterial(texture) {
    texture.anisotropy = 16;
    texture.wrapT = RepeatWrapping;
    texture.wrapS = RepeatWrapping;
    texture.repeat = new Vector2(16, 2);
}


function createMaterial() {

    const textureLoader = new TextureLoader();

    const texture_map = textureLoader.load(
        '/Assets/harshbricks-Unreal-Engine/harshbricks-albedo.png',
    );

    const texture_aoMap = textureLoader.load(
        '/Assets/harshbricks-Unreal-Engine/harshbricks-ao2.png',
    );

    const texture_roughnessMap = textureLoader.load(
        '/Assets/harshbricks-Unreal-Engine/harshbricks-roughness.png',
    );

    const texture_displacementMap = textureLoader.load(
        '/Assets/harshbricks-Unreal-Engine/harshbricks-height5-16.png',
    );

    const texture_metalnessMap = textureLoader.load(
        '/Assets/harshbricks-Unreal-Engine/harshbricks-metalness.png',
    );

    const texture_normalMap = textureLoader.load(
        '/Assets/harshbricks-Unreal-Engine/harshbricks-normal.png',
    );

    setMaterial(texture_map);
    setMaterial(texture_aoMap);
    setMaterial(texture_roughnessMap);
    setMaterial(texture_displacementMap);
    setMaterial(texture_metalnessMap);
    setMaterial(texture_normalMap);

    const material = new MeshToonMaterial( {
        map: texture_map, 
        side: DoubleSide,
        // aoMap: texture_aoMap,
        // roughnessMap: texture_roughnessMap,
        // metalnessMap: texture_metalnessMap,
        // normalMap: texture_normalMap,
        // normalScale: new Vector2(1, 1),
        // displacementMap: texture_displacementMap,
        // displacementScale: 0.04,
    } );

    return material;
}

function createCube() {

    // const geometry = new TorusGeometry(1.5, 0.2, 8, 64);
    const geometry = new BoxGeometry(200, 30, 20, 128, 128, 128);
    // const geometry = new SphereGeometry(5, 64, 64);
    const material = createMaterial();
    const cube = new Mesh(geometry, material);

    const radiansPerSecond = MathUtils.degToRad(30);
    let switchDir: boolean = false;

    //This will be called once per frame
    cube.tick = (delta) => {
        // cube.rotation.z += radiansPerSecond * delta;
        // cube.rotation.x += radiansPerSecond * delta;
        // cube.rotation.y += radiansPerSecond * delta;

        // if (!switchDir)
        //     cube.position.x -= delta % 3;
        // else
        //     cube.position.x += delta % 10;
        // if (cube.position.x > 5 || cube.position.x < -5)
        //     switchDir = !switchDir;
    }

    return cube;
}

export { createCube }