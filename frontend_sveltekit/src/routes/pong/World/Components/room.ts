import { 
    PlaneGeometry,
    BoxGeometry,
    MeshToonMaterial,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PlaneBufferGeometry,
    Mesh,
    DoubleSide,
} from 'three';


function createRoom() {

    const geometry = new PlaneGeometry(200, 20);
    const material = new MeshStandardMaterial({color: "white"});

    const plane = new Mesh(geometry, material);

    // plane.position.set(10, 10, 10);
    plane.position.y = -9.9;
    plane.rotation.set(- Math.PI / 2, 0, 0);
    // plane.visible = true;

    plane.receiveShadow = true;
    return plane ;
}

export {createRoom}