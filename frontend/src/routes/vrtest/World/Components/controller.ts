import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import type { WebGLRenderer, Scene } from 'three';

const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

function createController(index: number, renderer: WebGLRenderer, scene: Scene) {
    const controller = renderer.xr.getController(index);
    const controllerGrip = renderer.xr.getControllerGrip(index);
    const controllerModel = controllerModelFactory.createControllerModel(controllerGrip);
    const hand = renderer.xr.getHand(index);
    const handModel = handModelFactory.createHandModel(hand);
    
    // scene.add(controller);
    controllerGrip.add(controllerModel);
    scene.add(controllerGrip);
    hand.add(handModel);
    // scene.add(hand);
    return controller;
}

function createControllers(renderer: WebGLRenderer, scene: Scene) {
    const right = createController(0, renderer, scene);
    const left = createController(1, renderer, scene);

    return { right, left };
}

export { createControllers };
