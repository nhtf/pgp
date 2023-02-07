import {Vector} from "./Math";
import type { VectorObject } from "./Math";
import { WIDTH, HEIGHT, size } from "./Constants";


export interface BallObject {
	position: VectorObject;
	velocity: VectorObject;
}

//TODO make it look different
export class Ball {
	public position: Vector;
	public velocity: Vector;

	public constructor() {
		this.position = new Vector(WIDTH / 2, HEIGHT / 2);
		this.velocity = new Vector(1, 1);
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = "white";
		context.fillRect(this.position.x - size/2, this.position.y - size / 2, size, size);
	}

	public save(): BallObject {
		return {
			position: this.position.save(),
			velocity: this.velocity.save(),
		};
	}

	public load(object: BallObject) {
		this.position = Vector.load(object.position);
		this.velocity = Vector.load(object.velocity);
	}
}