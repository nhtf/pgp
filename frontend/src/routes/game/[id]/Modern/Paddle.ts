import {Vector} from "./Math";
import type { VectorObject } from "./Math";
import {
    linethickness,
    paddleHeight, 
    paddleWidth,
} from "./Constants";
import type { Line } from "../Classic/Classic";


/*
			rectangle of paddle : A-AB-B
								  |    |
								  |    |
								  C-CD-D
		*/

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
	public angle: number;
	public strokeColor: string;
	public fillColor: string;
	public owner: number;

	public constructor(position: Vector, angle: number, cf: string, cs: string, owner: number) {
		
		this.position = new Vector(position.x, position.y);
		this.height = paddleHeight;
        this.width = paddleWidth;
		this.angle = angle;
		this.strokeColor = cs;
		this.fillColor = cf;
		this.owner = owner;

	}

	public render(context: CanvasRenderingContext2D) {
        context.save();
        context.lineWidth = linethickness;
        context.fillStyle = this.fillColor;
        context.strokeStyle = this.strokeColor;
		context.lineJoin = "round";


		const crot = Math.cos(this.angle);
        const srot = Math.sin(this.angle);
        const w = this.width;
        const h = this.height / 2;

        const A = {x: crot * -w + srot * -h, y: -srot * -w + crot * -h};
        const B = {x: crot * w + srot * -h, y: -srot * w + crot * -h};
		const AB = {x: srot * -h, y: crot * -h}; //Middle between A and B
        const C = {x: crot * w + srot * h, y: -srot * w + crot * h};
		const CD = {x: srot * h, y: crot * h};
		context.beginPath();
		context.arc(this.position.x + AB.x , this.position.y + AB.y, this.width, Math.PI - this.angle, -this.angle);
        context.lineTo(this.position.x + B.x, this.position.y + B.y);
        context.lineTo(this.position.x + C.x, this.position.y + C.y);
		context.arc(this.position.x + CD.x , this.position.y + CD.y, this.width, - this.angle, Math.PI - this.angle);
		context.lineTo(this.position.x + A.x, this.position.y + A.y);
        context.fill();
        context.stroke();
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

	public getCollisionLines(): Line[] {
		const crot = Math.cos(this.angle);
        const srot = Math.sin(this.angle);
        const w = this.width;
        const h = this.height / 2;

		const A = {x: (crot * -w + srot * -h) + this.position.x, y: (-srot * -w + crot * -h) + this.position.y};
        const B = {x: (crot * w + srot * -h) + this.position.x, y: (-srot * w + crot * -h) + this.position.y};
        const C = {x: (crot * w + srot * h) + this.position.x, y: (-srot * w + crot * h) + this.position.y};
		const D = {x: (crot * -w + srot * h) + this.position.x, y: (-srot * -w + crot * h) + this.position.y};

		return [
			{p0: new Vector(A.x, A.y), p1: new Vector(B.x, B.y), name: `paddle-${this.owner}-top`},
			{p0: new Vector(C.x, C.y), p1: new Vector(D.x, D.y), name: `paddle-${this.owner}-bottom`},
			{p0: new Vector(A.x, A.y), p1: new Vector(C.x, C.y), name: `paddle-${this.owner}-left`},
			{p0: new Vector(B.x, B.y), p1: new Vector(D.x, D.y), name: `paddle-${this.owner}-right`},
		];
	}

	public renderCollisionLines(context: CanvasRenderingContext2D) {
		const crot = Math.cos(this.angle);
        const srot = Math.sin(this.angle);
        const w = this.width;
        const h = this.height / 2;
		const A = {x: (crot * -w + srot * -h) + this.position.x, y: (-srot * -w + crot * -h) + this.position.y};
        const B = {x: (crot * w + srot * -h) + this.position.x, y: (-srot * w + crot * -h) + this.position.y};
        const C = {x: (crot * w + srot * h) + this.position.x, y: (-srot * w + crot * h) + this.position.y};
		const D = {x: (crot * -w + srot * h) + this.position.x, y: (-srot * -w + crot * h) + this.position.y};


		context.save();
        context.lineWidth = 0.3;
        context.strokeStyle = "red";
		context.lineJoin = "round";

		context.beginPath();
		context.moveTo(A.x, A.y);
		context.lineTo(B.x, B.y);
		context.lineTo(C.x, C.y);
		context.lineTo(D.x, D.y);
		context.lineTo(A.x, A.y);
        context.stroke();
        context.restore();
	}
}