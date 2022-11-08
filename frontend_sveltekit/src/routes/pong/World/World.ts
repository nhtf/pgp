import { createCamera } from './Components/camera';
import { createCube } from './Components/cube';
import { createLights } from './Components/lights';
import { createScene } from './Components/scene';
import { createRoom } from './Components/room';
import { CameraHelper } from 'three';

import { createControls } from './systems/controls';
import { createRenderer } from './systems/renderer';
import { Resizer } from './systems/Resizer';
import { Loop } from './systems/Loop';

class World {

    private _camera: any;
    private _scene: any;
    private _renderer: any;
    private _resizer: any;
    private _container: any;
    private _loop: any;
    private _controls: any;

    constructor(container) { //synchronous constructor
        this._camera = createCamera();
        this._scene = createScene();
        this._renderer = createRenderer();


        this._loop = new Loop(this._camera, this._scene, this._renderer);
        this._container = container;
        this._container.append(this._renderer.domElement);

        this._controls = createControls(this._camera, this._renderer.domElement);

        const { light } = createLights();

        this._scene.add(light);

        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 1000;

        const cube1 = createCube();
        // cube1.position.y +=1;
        cube1.castShadow = true;
        this._scene.add(cube1);
        // cube1.receiveShadow = true;

        const cube2 = createCube();
        cube2.scale.set(0.1, 0.1, 0.1);
        cube2.position.y = 7;
        cube2.castShadow = true;
        // this._scene.add(cube2);

        const room = createRoom();
        this._scene.add(room);

        const helper = new CameraHelper( light.shadow.camera );

        // cube2.receiveShadow = true;
        // cube2.position.set(10, 2, 10);

        

        this._controls.target.copy(cube1.position);
        // this._loop.updatables.push(cube1);
        this._loop.updatables.push(this._controls);

        this._scene.add(helper);

        this._resizer = new Resizer(this._container, this._camera, this._renderer);
    }

    async init() { //asynchronous constructor

    }

    render() {
        this._renderer.render(this._scene, this._camera);
    }

    resize() {
        this._resizer.setSize(this._container, this._camera, this._renderer);
    }

    start() {
        this._loop.start();
    }

    stop() {
        this._loop.stop();
    }
}

export { World };