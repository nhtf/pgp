import { World } from "../Systems/world";
import { addRoomToWorld } from "./room";
import { createLights} from "./lights";
import { createControllers } from "./controller";
import { Ball } from "./ball";
import { Racket } from "./racket";
import type { XRTargetRaySpace } from "three";
import { loadModel } from "../Systems/ModelLoader";
import { Vector } from "../Systems/math";

export class Game extends World {
	leftController: XRTargetRaySpace | undefined;
	rightController: XRTargetRaySpace | undefined;
	ball: Ball | undefined;
	racket: Racket | undefined;

	constructor(container: Element) {
		super(container);
	}

	async load() {
		const controllers = createControllers(this.renderer, this.scene);
		this.leftController = controllers.left;
		this.rightController = controllers.right;

		const lights = createLights();
		this.scene.add(lights.light);
		this.scene.add(lights.hemisphere);
		this.scene.add(lights.ambient);

		addRoomToWorld(this);
		
		this.ball = new Ball();
		this.add(this.ball);

		const racketModel = await loadModel("./Assets/gltf/pingpong.gltf", 1);
		if (racketModel === undefined) {
			console.log("error loading model")
		} else {
			this.racket = new Racket(this.rightController, racketModel);
			this.add(this.racket);
		}

		const self = this;
		this.rightController.addEventListener("selectstart", function() {
			if (self.ball !== undefined && self.racket !== undefined) {
				self.ball.position = self.racket.position.add(new Vector(0, 0.5, 0));
				self.ball.linearVelocity = new Vector(0, 0, 0);
				self.ball.angularVelocity = new Vector(0, 0, 0);
			}
		});
	}
}
