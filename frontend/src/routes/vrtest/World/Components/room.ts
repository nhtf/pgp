import {
    PlaneGeometry,
    MeshStandardMaterial,
    Mesh,
    DoubleSide,
    TextureLoader,
    Texture,
    RepeatWrapping,
    Vector2,
    // Group,
} from 'three';

import { Ammo } from '../Systems/ammo';
import { Entity } from '../Systems/entity';
import { Vector, Quaternion } from '../Systems/math';

import type { World } from '../Systems/world';

function setMaterial(texture: Texture) {
    texture.anisotropy = 16;
    texture.wrapT = RepeatWrapping;
    texture.wrapS = RepeatWrapping;
    texture.repeat = new Vector2(10, 10);
}

function createMaterial() {

    const textureLoader = new TextureLoader();
    let materialdefault: MeshStandardMaterial;

    if (typeof document !== "undefined") {
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

        materialdefault = new MeshStandardMaterial({
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
    }
    else
    {
        materialdefault = new MeshStandardMaterial({ color: 'white', side:  DoubleSide});
    }

    return materialdefault;
}

const width: number = 20;
const height: number = 5;
const depth: number = 20;
const thickness: number = 0.01;
const material = createMaterial();

class Floor extends Entity {
    constructor() {
        const floor_geometry = new PlaneGeometry(depth, width);

        const floorBox = new Ammo.btVector3(width, thickness, depth);
        const floorShape = new Ammo.btBoxShape(floorBox);
        const ground_mesh = new Mesh(floor_geometry, material);

        ground_mesh.position.y = 0;
        ground_mesh.rotation.set(- Math.PI / 2, 0, 0);
        ground_mesh.receiveShadow = true;

        super(ground_mesh, floorShape, 0, new Vector(0, 0, 0), new Quaternion(0, 0, 0, 1), false); //floor
    }
}

class Ceiling extends Entity {
    constructor() {
        const ceiling_geometry = new PlaneGeometry(depth, width);

        const ceilingBox = new Ammo.btVector3(width, thickness, depth);
        const ceilingShape = new Ammo.btBoxShape(ceilingBox);
        const ceiling_mesh = new Mesh(ceiling_geometry, material);

        ceiling_mesh.position.y = +height;
        ceiling_mesh.rotation.set(- Math.PI / 2, 0, 0);
        ceiling_mesh.receiveShadow = true;

        super(ceiling_mesh, ceilingShape, 0, new Vector(0, height, 0), new Quaternion(0, 0, 0, 1), false); //ceiling
    }
}

class WallEast extends Entity {
    constructor() {
        const wallEastGeometry = new PlaneGeometry(depth, height);

        const wallEastBox = new Ammo.btVector3(width, height, thickness);
        const wallEastShape = new Ammo.btBoxShape(wallEastBox);
        const wallEastMesh = new Mesh(wallEastGeometry, material);

        wallEastMesh.position.z = -width / 2;
        wallEastMesh.position.y = height / 2
        wallEastMesh.rotation.set(0, 0, 0);
        wallEastMesh.receiveShadow = true;

        super(wallEastMesh, wallEastShape, 0, new Vector(0, 0, -width /2), new Quaternion(0, 0, 0, 1), false); //wallEast
    }
}

class WallWest extends Entity {
    constructor() {
        const wallWestGeometry = new PlaneGeometry(depth, height);

        const wallWestBox = new Ammo.btVector3(width, height, thickness);
        const wallWestShape = new Ammo.btBoxShape(wallWestBox);
        const wallWestMesh = new Mesh(wallWestGeometry, material);

        wallWestMesh.position.z = +width / 2;
        wallWestMesh.position.y = height / 2
        wallWestMesh.rotation.set(0, 0, 0);
        wallWestMesh.receiveShadow = true;

        super(wallWestMesh, wallWestShape, 0, new Vector(0, 0, width / 2), new Quaternion(0, 0, 0, 1), false); //wallWest
    }
}

class WallNorth extends Entity {
    constructor() {
        const wallNorthGeometry = new PlaneGeometry(width, height);

        const wallNorthBox = new Ammo.btVector3(thickness, height, depth);
        const wallNorthShape = new Ammo.btBoxShape(wallNorthBox);
        const wallNorthMesh = new Mesh(wallNorthGeometry, material);

        wallNorthMesh.position.y = height / 2;
        wallNorthMesh.position.x = -depth / 2;
        wallNorthMesh.rotation.set(0, -Math.PI / 2, 0);
        wallNorthMesh.receiveShadow = true;

        super(wallNorthMesh, wallNorthShape, 0, new Vector(-depth / 2, 0, 0), new Quaternion(0, 0, 0, 1), false); //wallNorth
    }
}

class WallSouth extends Entity {
    constructor() {
        const wallSouthGeometry = new PlaneGeometry(width, height);

        const wallSouthhBox = new Ammo.btVector3(thickness, height, depth);
        const wallSouthhShape = new Ammo.btBoxShape(wallSouthhBox);
        const wallSouthhMesh = new Mesh(wallSouthGeometry, material);

        wallSouthhMesh.position.y = height / 2;
        wallSouthhMesh.position.x = +depth / 2;
        wallSouthhMesh.rotation.set(0, -Math.PI / 2, 0);
        wallSouthhMesh.receiveShadow = true;

        super(wallSouthhMesh, wallSouthhShape, 0, new Vector(depth / 2, 0, 0), new Quaternion(0, 0, 0, 1), false); //wallSouth
    }
}

function addRoomToWorld(world: World) {
    
        const floor = new Floor();
        const ceiling = new Ceiling();        
        const wallEast = new WallEast();
        const wallWest = new WallWest();
        const wallNorth = new WallNorth();
        const wallSouth = new WallSouth();

        world.add(floor);
        world.add(ceiling);
        world.add(wallEast);
        world.add(wallWest);
        world.add(wallNorth);
        world.add(wallSouth);
}

export { addRoomToWorld };