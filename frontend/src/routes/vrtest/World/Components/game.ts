import { World } from "../Systems/world";
import { addRoomToWorld } from "./room";
import { createLights} from "./lights";
import { createControllers } from "./controller";
import { Ball } from "./ball";
import { Racket } from "./racket";
import type { XRTargetRaySpace } from "three";
import { loadModel } from "../Systems/ModelLoader";
import { Vector } from "../Systems/math";
import type { EntityObject } from "../Systems/entity";
import type { Object3D } from "three";

export class Game extends World {
	leftController: XRTargetRaySpace | undefined;
	rightController: XRTargetRaySpace | undefined;
	ball: Ball | undefined;
	racket: Racket | undefined;
	racketModel: Object3D | undefined; 

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
		this.ball.name = "BALL";
		this.add(this.ball);

		this.racketModel = await loadModel("./Assets/gltf/newPingPong/newPingPong.gltf", 0.048);
		// const request = await fetch("http://localhost:3000/whoami", { mode: "cors", credentials: "include" });
		// const { id } = await request.json();
		if (this.racketModel === undefined) {
			console.log("error loading model")
		} else {
			this.racket = new Racket(this.rightController, this.racketModel);
			// this.racket.name = "RACKET-" + id;
			this.racket.name = "RACKET-" + '1';
			this.add(this.racket);
		}

		const self = this;
		this.rightController.addEventListener("selectstart", function() {
			if (self.ball !== undefined && self.racket !== undefined) {
				self.ball.position = self.racket.position.add(new Vector(0, 0.5, -0.1));
				self.ball.linearVelocity = new Vector(0, 0, 0);
				self.ball.angularVelocity = new Vector(0, 0, 0);
			}
		});
	}
}
