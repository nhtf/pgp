import {
    PlaneGeometry,
    BoxGeometry,
    MeshToonMaterial,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Mesh,
    DoubleSide,
    TextureLoader,
    Texture,
    RepeatWrapping,
    Vector2,
    Group,
} from 'three';

function setMaterial(texture: Texture) {
    texture.anisotropy = 16;
    texture.wrapT = RepeatWrapping;
    texture.wrapS = RepeatWrapping;
    texture.repeat = new Vector2(10, 10);
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

    const material = new MeshStandardMaterial({
        map: texture_map,
        side: DoubleSide,
        aoMap: texture_aoMap,
        roughnessMap: texture_roughnessMap,
        metalnessMap: texture_metalnessMap,
        normalMap: texture_normalMap,
        normalScale: new Vector2(1, 1),
        displacementMap: texture_displacementMap,
        displacementScale: 0.04,
    });

    return material;
}

function createRoom(): Group {

    const width: number = 20;
    const height: number = 5;
    const depth: number = 20;

    const floor_geometry = new PlaneGeometry(depth, width);
    const wall_we_geometry = new PlaneGeometry(depth, height);
    const wall_ns_geometry = new PlaneGeometry(width, height);
    const material = createMaterial();

    const ground = new Mesh(floor_geometry, material);
    ground.position.y = 0;
    ground.rotation.set(- Math.PI / 2, 0, 0);
    ground.receiveShadow = true;

    const ceiling = new Mesh(floor_geometry, material);
    ceiling.position.y = +height;
    ceiling.rotation.set(- Math.PI / 2, 0, 0);
    ceiling.receiveShadow = true;

    const wallEast = new Mesh(wall_we_geometry, material);
    wallEast.position.z = -width / 2;
    wallEast.position.y = height / 2;
    wallEast.rotation.set(0, 0, 0);
    wallEast.receiveShadow = true;

    const wallWest = new Mesh(wall_we_geometry, material);
    wallWest.position.z = +width / 2;
    wallWest.position.y = height / 2;
    wallWest.rotation.set(0, 0, 0);
    wallWest.receiveShadow = true;

    const wallNorth = new Mesh(wall_ns_geometry, material);
    wallNorth.position.y = height / 2;
    wallNorth.position.x = -depth / 2;
    wallNorth.rotation.set(0, - Math.PI / 2, 0);

    const wallSouth = new Mesh(wall_ns_geometry, material);
    wallSouth.position.y = height / 2;
    wallSouth.position.x = +depth / 2;
    wallSouth.rotation.set(0, - Math.PI / 2, 0);

    const room = new Group();
    room.add(ground, ceiling, wallEast, wallWest, wallNorth, wallSouth)
    return room;
}

export { createRoom }