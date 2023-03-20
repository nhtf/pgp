import { Vector, isInConvexHull } from "../lib2D/Math2D";
import type { PaddleObject } from "../lib2D/interfaces";
import {
	HEIGHT,
    linethickness,
    paddleHeight, 
    paddleWidth,
	WIDTH,
} from "./Constants";
import type { Line, CollisionLine } from "../lib2D/Math2D";
import type { Team } from "../lib2D/Team";


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
	public rotation: number;
	public strokeColor: string;
	public fillColor: string;
	public owner: number;
	public ping: number;
	public team: Team;

	public constructor(position: Vector, angle: number, cf: string, cs: string, owner: number, team: Team) {
		
		this.position = new Vector(position.x, position.y);
		this.height = paddleHeight;
        this.width = paddleWidth;
		this.rotation = angle;
		this.strokeColor = cs;
		this.fillColor = cf;
		this.owner = owner;
		this.ping = 0;
		this.team = team;
	}

	// public render(context: CanvasRenderingContext2D) {
    //     context.save();
    //     context.lineWidth = linethickness;
    //     context.fillStyle = this.fillColor;
    //     context.strokeStyle = this.strokeColor;
	// 	context.lineJoin = "round";


	// 	const crot = Math.cos(this.rotation);
    //     const srot = Math.sin(this.rotation);
    //     const w = this.width;
    //     const h = this.height / 2;

    //     const A = {x: crot * -w + srot * -h, y: -srot * -w + crot * -h};
    //     const B = {x: crot * w + srot * -h, y: -srot * w + crot * -h};
	// 	const AB = {x: srot * -h, y: crot * -h}; //Middle between A and B
	// 	const D = {x: crot * w + srot * h, y: -srot * w + crot * h};
	// 	const CD = {x: srot * h, y: crot * h};
	// 	context.beginPath();
	// 	context.arc(this.position.x + AB.x , this.position.y + AB.y, this.width, Math.PI - this.rotation, -this.rotation);
    //     context.lineTo(this.position.x + B.x, this.position.y + B.y);
    //     context.lineTo(this.position.x + D.x, this.position.y + D.y);
	// 	context.arc(this.position.x + CD.x , this.position.y + CD.y, this.width, - this.rotation, Math.PI - this.rotation);
	// 	context.lineTo(this.position.x + A.x, this.position.y + A.y);
    //     context.fill();
    //     context.stroke();
    //     context.restore();
	// }

	public save(): PaddleObject {
		return {
			position: this.position.save(),
			height: this.height,
            width: this.width,
			userID: this.userID,
			ping: this.ping,
			rotation: this.rotation,
		};
	}

	public load(object: PaddleObject) {
		this.position = Vector.load(object.position);
		this.height = object.height;
        this.width = object.width;
		this.userID = object.userID;
		this.ping = object.ping;
		this.rotation = object.rotation;
	}

	public getCollisionLines(level: any): CollisionLine[] {
		const crot = Math.cos(this.rotation);
		const srot = Math.sin(this.rotation);

		let lines: CollisionLine[] = [];

		for (let i = 0; i < level.paddleContour.length;) {
			const p1 = {x: level.paddleContour[i] - WIDTH / 2, y: level.paddleContour[i + 1] - HEIGHT / 2};
			const p2 = {x: level.paddleContour[i + 2] - WIDTH / 2, y: level.paddleContour[i + 3] - HEIGHT / 2};

			const A = new Vector((crot * p1.x + srot * p1.y) + this.position.x, (-srot * p1.x + crot * p1.y) + this.position.y);
			const B = new Vector((crot * p2.x + srot * p2.y) + this.position.x, (-srot * p2.x + crot * p2.y) + this.position.y);
			const line = {p0: A, p1: B, name: `paddle-${this.owner}-${(i + 4) / 4}`};

			const colLine: CollisionLine = {p0: line.p0, p1: line.p1, name: line.name, normal: (line.p1.sub(line.p0).tangent().normalize())};
			lines.push(colLine);
			i += 4;
		}
		// console.log("collission: ", lines);
		// if (this.owner === 0) {
		// 	console.log("pos: ", this.position);
		// 	console.log(lines);
		// }
		return lines;
	}

	// public renderCollisionLines(context: CanvasRenderingContext2D) {
	// 	const collisionLines = this.getCollisionLines();
	// 	context.save();
    //     context.lineWidth = 0.3;
    //     context.strokeStyle = "red";
	// 	context.lineJoin = "round";

	// 	for (let line of collisionLines) {
	// 		context.beginPath();
	// 		context.moveTo(line.p0.x, line.p0.y);
	// 		context.lineTo(line.p1.x, line.p1.y);
	// 		context.stroke();
	// 	}
    //     context.stroke();
    //     context.restore();
	// }

	public isInPlayerArea(pos: Vector, area: CollisionLine[]) {
		const crot = Math.cos(this.rotation + Math.PI / 2);
        const srot = Math.sin(this.rotation + Math.PI / 2);
        const w = this.width;
        const h = this.height / 2;

		let points = []
		points.push(new Vector((crot * -w + srot * -h) + pos.x, (-srot * -w + crot * -h) + pos.y));
		points.push(new Vector((crot * w + srot * -h) + pos.x, (-srot * w + crot * -h) + pos.y));
		points.push(new Vector((crot * -w + srot * h) + pos.x, (-srot * -w + crot * h) + pos.y));
		points.push(new Vector((crot * w + srot * h) + pos.x, (-srot * w + crot * h) + pos.y));

		for (let point of points) {
			if (!isInConvexHull(point, area, true))
				return false;
		}
		return true;
	}
}
