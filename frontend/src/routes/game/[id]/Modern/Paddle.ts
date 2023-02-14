import {Vector} from "./Math";
import type { VectorObject } from "./Math";
import { 
    WIDTH, 
    HEIGHT, 
    linethickness,
    paddlexOffset, 
    paddleHeight, 
    paddleWidth,
    paddleFillC,
    paddleStrokeC
} from "./Constants";

export interface PaddleObject {
	position: VectorObject;
	height: number;
	userID?: number;
    width: number;
}

//TODO also change how the paddles are placed + rotated depending on things
export class Paddle {
	public position: Vector;
	public height: number;
    public width: number;
	public userID?: number;

	public constructor(side: "left" | "right") {
		if (side === "left") {
			this.position = new Vector(paddlexOffset, HEIGHT / 2);
		} else {
			this.position = new Vector(WIDTH - paddlexOffset, HEIGHT / 2);
		}

		this.height = paddleHeight;
        this.width = paddleWidth;
	}

	public render(context: CanvasRenderingContext2D) {
        context.save();
        context.lineWidth = linethickness;
        let x = this.position.x;
        let y = this.position.y - this.height / 2; 
        context.beginPath();
        context.fillStyle = paddleFillC;
        context.strokeStyle = paddleStrokeC;
        context.arc(x, y, this.width, Math.PI, 0);
        context.lineTo(x + this.width, y + this.height - this.width);
        context.arc(x, y - this.width + this.height, this.width, 0, Math.PI);
        context.lineTo(x - this.width, y);
        context.stroke();
        context.fill();
        context.restore();
	}

	public save(): PaddleObject {
		return {
			position: this.position.save(),
			height: this.height,
            width: this.width,
			userID: this.userID,
		};
	}

	public load(object: PaddleObject) {
		this.position = Vector.load(object.position);
		this.height = object.height;
        this.width = object.width;
		this.userID = object.userID;
	}
}