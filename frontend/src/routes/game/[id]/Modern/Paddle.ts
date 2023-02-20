import { Vector, intersection, type CollisionLine } from "../lib2D/Math2D";
import type { PaddleObject } from "../lib2D/interfaces";
import {
    linethickness,
    paddleHeight, 
    paddleWidth,
} from "./Constants";
import type { Line } from "../lib2D/Math2D";


/*
			rectangle of paddle : A-AB-B
								  |    |
								  |    |
								  C-CD-D
		*/

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
		const D = {x: crot * w + srot * h, y: -srot * w + crot * h};
		const CD = {x: srot * h, y: crot * h};
		context.beginPath();
		context.arc(this.position.x + AB.x , this.position.y + AB.y, this.width, Math.PI - this.angle, -this.angle);
        context.lineTo(this.position.x + B.x, this.position.y + B.y);
        context.lineTo(this.position.x + D.x, this.position.y + D.y);
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

	public getCollisionLines(): CollisionLine[] {
		const crot = Math.cos(this.angle);
        const srot = Math.sin(this.angle);
        const w = this.width;
        const h = this.height / 2;

		const A = {x: (crot * -w + srot * -h) + this.position.x, y: (-srot * -w + crot * -h) + this.position.y};
        const B = {x: (crot * w + srot * -h) + this.position.x, y: (-srot * w + crot * -h) + this.position.y};
        const C = {x: (crot * -w + srot * h) + this.position.x, y: (-srot * -w + crot * h) + this.position.y};
		const D = {x: (crot * w + srot * h) + this.position.x, y: (-srot * w + crot * h) + this.position.y};

		// console.log("owner: ", this.owner);
		const lineTop: Line = {	p0: new Vector(A.x, A.y), p1: new Vector(B.x, B.y), name: `paddle-${this.owner}-top`}
		const lineBottom: Line = {p0: new Vector(C.x, C.y), p1: new Vector(D.x, D.y), name: `paddle-${this.owner}-bottom`};
		const lineLeft: Line = {p0: new Vector(A.x, A.y), p1: new Vector(C.x, C.y), name: `paddle-${this.owner}-left`};
		const lineRight: Line = {p0: new Vector(B.x, B.y), p1: new Vector(D.x, D.y), name: `paddle-${this.owner}-right`};


		return [
			{	p0: lineTop.p0, p1: lineTop.p1, name: lineTop.name,
				normal: (lineTop.p1.sub(lineTop.p0).tangent().normalize())},
			{	p0: lineBottom.p0, p1: lineBottom.p1, name: lineBottom.name,
				normal: (lineBottom.p1.sub(lineBottom.p0).tangent().normalize())},
			{	p0: lineLeft.p0, p1: lineLeft.p1, name: lineLeft.name,
				normal: (lineLeft.p1.sub(lineLeft.p0).tangent().normalize())},
			{	p0: lineRight.p0, p1: lineRight.p1, name: lineRight.name,
				normal: (lineRight.p1.sub(lineRight.p0).tangent().normalize())},
		];
	}

	public renderCollisionLines(context: CanvasRenderingContext2D) {
		const collisionLines = this.getCollisionLines();
		context.save();
        context.lineWidth = 0.3;
        context.strokeStyle = "red";
		context.lineJoin = "round";

		context.beginPath();
		context.moveTo(collisionLines[0].p0.x, collisionLines[0].p0.y);
		for (let line of collisionLines) {
			context.lineTo(line.p1.x, line.p1.y);
		}
		context.lineTo(collisionLines[0].p0.x, collisionLines[0].p0.y);
		// context.lineTo(B.x, B.y);
		// context.lineTo(D.x, D.y);
		// context.lineTo(C.x, C.y);
		// context.lineTo(A.x, A.y);
        context.stroke();
        context.restore();
	}

	public isInPaddle(entityPos: Vector): boolean {
		const collisionLines = this.getCollisionLines();
		for (let line of collisionLines) {
			const maxY = Math.max(line.p0.y, line.p1.y);
			const minY = Math.min(line.p0.y, line.p1.y);
			const maxX = Math.max(line.p0.x, line.p1.x);
			const minX = Math.min(line.p0.x, line.p1.x);

			if (line.normal.x > 0 && entityPos.x > line.p0.x && entityPos.y >= minY && entityPos.y <= maxY)
				return false;
			else if (line.normal.x < 0 && entityPos.x < line.p0.x && entityPos.y >= minY && entityPos.y <= maxY)
				return false;
			if (line.normal.y > 0 && entityPos.y > line.p0.y && entityPos.x >= minX && entityPos.x <= maxX)
				return false;
			else if (line.normal.y < 0 && entityPos.y < line.p0.y && entityPos.x >= minX && entityPos.x <= maxX)
				return false;
		}
		console.log("paddlePos: ", JSON.stringify(this.position), "ballpos: ", JSON.stringify(entityPos));
		return true;
	}
}
