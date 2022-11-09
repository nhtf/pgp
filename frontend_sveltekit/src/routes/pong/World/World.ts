import { createCamera } from './Components/camera';
import { createCube } from './Components/cube';
import { createLights } from './Components/lights';
import { createScene } from './Components/scene';
import { createRoom } from './Components/room';

import { createRenderer } from './systems/renderer';
import { Resizer } from './systems/Resizer';
import { Loop } from './systems/Loop';
// import { VRButton } from 'three/examples/jsm/webxr/VRButton';
let VRButton: any;


import type {
    Camera,
    Scene,
    WebGLRenderer,
    } from 'three';

type movement = {
    mouseMovementX: number;
    mouseMovementY: number;
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    moveSpeed: number;
};

class World {

    private _camera: Camera;
    private _scene: Scene;
    private _renderer: WebGLRenderer;
    private _resizer: Resizer;
    private _container: any;
    private _loop: Loop;
    private _move: movement;
    private _socket: any;

    constructor(container: Element | null, socket: any) { //synchronous constructor
        this._camera = createCamera();
        this._scene = createScene();
        this._renderer = createRenderer();
        this._move = {
            mouseMovementX: 0,
            mouseMovementY: 0,
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            moveSpeed: 0.5,
        };
        this._socket = socket;


        this._loop = new Loop(this._camera, this._scene, this._renderer, this._move, this._socket);
        this._container = container;
        this._container.append(this._renderer.domElement);

        const { light, ambient } = createLights();

        this._scene.add(light);

        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 25;

        const room = createRoom();
        this._scene.add(room);

        this._resizer = new Resizer(this._container, this._camera, this._renderer);
    }

    public async init() { //asynchronous constructor
        VRButton = (await import('three/examples/jsm/webxr/VRButton.js')).VRButton;
        this._container.append(VRButton.createButton(this._renderer));
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

    movement(e: any) {
        if (this._renderer.xr.isPresenting)
            return ;
        if (e.type === "keydown") {
            switch (e.key) {
                
                case 's':
                    this._move.moveBackward = true;
                    break;
                case 'w':
                    this._move.moveForward = true;
                    break;
                case 'a':
                    this._move.moveLeft = true;
                    break;
                case 'd': 
                    this._move.moveRight = true;
                    break;
            }
        }
        if (e.type === "keyup") {
            switch (e.key) {
                case 's':
                    this._move.moveBackward = false;
                    break;
                case 'w':
                    this._move.moveForward = false;
                    break;
                case 'a':
                    this._move.moveLeft = false;
                    break;
                case 'd': 
                    this._move.moveRight = false;
                    break;
            }
        }
        else if (e.type === "mousemove") {
            var moveX: number = e.movementX  || 0;
            var moveY: number = e.movementY  || 0;
            this._move.mouseMovementX += moveX;
            this._move.mouseMovementY += moveY;
        }
    }
}

export { World };