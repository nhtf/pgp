import {Vector} from "./Math";
import type { VectorObject } from "./Math";
import { WIDTH, HEIGHT, size, paddleStrokeC, paddleFillC } from "./Constants";


export interface BallObject {
	position: VectorObject;
	previousPos: VectorObject;
	velocity: VectorObject;
}

//for making the trailing effect
//TODO make it so it keeps hold of the previous <number here> positions and clears the oldest
let positions: Vector[] = [];

//TODO make a trailling effect?
export class Ball {
	public position: Vector;
	public previousPos: Vector;
	public velocity: Vector;

	public constructor() {
		this.position = new Vector(WIDTH / 2, HEIGHT / 2);
		this.previousPos = new Vector(WIDTH / 2, HEIGHT / 2);
		this.velocity = new Vector(1, 1);
		positions.push(this.position);
	}

	public render(context: CanvasRenderingContext2D) {
		context.fillStyle = paddleFillC;
		context.strokeStyle = paddleStrokeC;
		context.beginPath();

		context.moveTo(this.position.x - 5 * this.velocity.x, this.position.y - 5 * this.velocity.y);
		context.lineTo(this.position.x - size/2, this.position.y - size /2);
		context.stroke();

		const posX = this.position.x;
		const posY = this.position.y;

		context.beginPath();
		context.fillStyle = paddleFillC;
		context.strokeStyle = paddleStrokeC;
		context.arc(posX - size / 2, posY - size / 2, size, 0, Math.PI * 2);
		context.fill();
		context.stroke();
		// context.fillRect(this.position.x - size/2, this.position.y - size / 2, size, size);
	}

	public save(): BallObject {
		return {
			position: this.position.save(),
			velocity: this.velocity.save(),
			previousPos: this.previousPos.save(),
		};
	}

	public load(object: BallObject) {
		this.position = Vector.load(object.position);
		this.velocity = Vector.load(object.velocity);
		this.previousPos = Vector.load(object.previousPos);
	}
}