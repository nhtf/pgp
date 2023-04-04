import { Vector, isInConvexHull } from "../lib2D/Math2D";
import {
	HEIGHT,
    paddleHeight, 
    paddleWidth,
	WIDTH,
} from "./Constants";
import type { Line } from "../lib2D/Math2D";
import type { Team } from "../lib2D/Team";
import type { VectorObject } from "../lib2D/Math2D";
import { serialize, deserialize } from "../Math";

export interface PaddleObject {
	transform: string;
	height: number;
    width: number;
	userId?: number;
	ping: number;
}

export class Paddle {
	public position: Vector;
	public height: number;
    public width: number;
	public userId?: number;
	public rotation: number;
	public owner: number;
	public ping: number;
	public team: Team;
	private paddleContour: Line[] = [];
	private collisionLines: Line[] = [];

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
			const p2 = new Vector(paddleContour[i + 2] - WIDTH / 2, paddleContour[i + 3] - HEIGHT / 2);
			const p3 = new Vector(paddleContour[i] - WIDTH / 2, paddleContour[i + 1] - HEIGHT / 2);
			this.paddleContour.push({p0: p0, p1: p1, name: `paddle${(i + 4)/4}`});
			this.collisionLines.push({p0: p2, p1: p3, name: `paddle${(i + 4)/4}`});
			i += 4;
		}
	}

	public save(): PaddleObject {
		const buffer = new Float64Array(3);
		buffer[0] = this.position.x;
		buffer[1] = this.position.y;
		buffer[2] = this.rotation;

		return {
			transform: serialize(buffer.buffer),
			height: this.height,
            width: this.width,
			userId: this.userId,
			ping: this.ping,
		};
	}

	public load(object: PaddleObject) {
		const buffer = new Float64Array(deserialize(object.transform));

		this.position = new Vector(buffer[0], buffer[1]);
		this.height = object.height;
        this.width = object.width;
		this.userId = object.userId;
		this.ping = object.ping;
		this.rotation = buffer[2];
	}

	public getCollisionLines(): Line[] {
		const crot = Math.cos(this.rotation);
		const srot = -Math.sin(this.rotation); //because y is flipped

		for (let i = 0; i < this.paddleContour.length; i++) {
			const p0 = this.paddleContour[i].p0;
			const p1 = this.paddleContour[i].p1;

			this.collisionLines[i].p0.x = (crot * p0.x + srot * p0.y) + this.position.x;
			this.collisionLines[i].p0.y = (-srot * p0.x + crot * p0.y) + this.position.y;
			this.collisionLines[i].p1.x = (crot * p1.x + srot * p1.y) + this.position.x;
			this.collisionLines[i].p1.y = (-srot * p1.x + crot * p1.y) + this.position.y;
			this.collisionLines[i].name = `paddle-${this.owner}-${(i + 4) / 4}`;
		}
		return this.collisionLines;
	}

	public isInPlayerArea(pos: VectorObject, area: Line[]) {
		const crot = Math.cos(this.rotation);
        const srot = -Math.sin(this.rotation);
        const w = this.width;
        const h = this.height / 2;

		let points: VectorObject[] = []
		points.push({ x: (crot * -w + srot * -h) + pos.x, y:  (-srot * -w + crot * -h) + pos.y});
		points.push({ x: (crot * w + srot * -h) + pos.x, y:  (-srot * w + crot * -h) + pos.y});
		points.push({ x: (crot * -w + srot * h) + pos.x, y:  (-srot * -w + crot * h) + pos.y});
		points.push({ x: (crot * w + srot * h) + pos.x, y:  (-srot * w + crot * h) + pos.y});

		for (let point of points) {
			if (!isInConvexHull(point, area, true))
				return false;
		}
		return true;
	}
}
