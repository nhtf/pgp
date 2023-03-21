import { Vector, isInConvexHull } from "../lib2D/Math2D";
import type { PaddleObject } from "../lib2D/interfaces";
import {
	HEIGHT,
    paddleHeight, 
    paddleWidth,
	WIDTH,
} from "./Constants";
import type { Line } from "../lib2D/Math2D";
import type { Team } from "../lib2D/Team";

export class Paddle {
	public position: Vector;
	public height: number;
    public width: number;
	public userID?: number;
	public rotation: number;
	public owner: number;
	public ping: number;
	public team: Team;
	private paddleContour: Line[] = [];

	public constructor(position: Vector, angle: number, owner: number, team: Team, paddleContour: number[]) {
		
		this.position = new Vector(position.x, position.y);
		this.height = paddleHeight;
        this.width = paddleWidth;
		this.rotation = angle;
		this.owner = owner;
		this.ping = 0;
		this.team = team;
		for (let i = 0; i < paddleContour.length; ) {
			const p1 = new Vector(paddleContour[i + 2] - WIDTH / 2, paddleContour[i + 3] - HEIGHT / 2);
			const p0 = new Vector(paddleContour[i] - WIDTH / 2, paddleContour[i + 1] - HEIGHT / 2);
			this.paddleContour.push({p0: p0, p1: p1, name: `paddle${(i + 4)/4}`});
			i += 4;
		}
	}

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

	public getCollisionLines(): Line[] {
		const crot = Math.cos(this.rotation);
		const srot = -Math.sin(this.rotation); //because y is flipped

		let lines: Line[] = [];

		for (let i = 0; i < this.paddleContour.length; i++) {
			const p0 = this.paddleContour[i].p0;
			const p1 = this.paddleContour[i].p1;
			const A = new Vector((crot * p0.x + srot * p0.y) + this.position.x, (-srot * p0.x + crot * p0.y) + this.position.y);
			const B = new Vector((crot * p1.x + srot * p1.y) + this.position.x, (-srot * p1.x + crot * p1.y) + this.position.y);
			const line = {p0: A, p1: B, name: `paddle-${this.owner}-${(i + 4) / 4}`};

			const colLine: Line = {p0: line.p0, p1: line.p1, name: line.name};
			lines.push(colLine);
		}
		return lines;
	}

	public isInPlayerArea(pos: Vector, area: Line[]) {
		const crot = Math.cos(this.rotation);
        const srot = -Math.sin(this.rotation);
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
