import { Vector, intersection } from "../lib2D/Math2D";
import type { VectorObject, Line } from "../lib2D/Math2D";
import { FIELDWIDTH, FIELDHEIGHT } from "./Constants";
import type { BallObject } from "../lib2D/interfaces";

//for making the trailing effect
let positions: VectorObject[] = [];

export class Ball {
	public position: Vector;
	public velocity: Vector;
	public counter: number;

	public constructor() {
		this.position = new Vector(FIELDWIDTH / 2, FIELDHEIGHT / 2);
		this.velocity = new Vector(1.41, 1.41);
		this.counter = 0;
	}

	public collision(lines: Line[]): [Line, Vector, number] | null {
		let closest: [Line, Vector, number] | null = null;
		for (let line of lines) {
			const p0 = new Vector(line.p0.x, line.p0.y);
			const p1 = new Vector(line.p1.x, line.p1.y);
			const retLine: Line = {p0: p0, p1: p1, name: line.name};
			const [t0, t1] = intersection([this.position, this.velocity], [p0, p1.sub(p0)])

			if (t1 >= 0 && t1 <= 1 && t0 > 0.001) {
				if (closest === null || t0 < closest[2]) {
					const pos = this.position.add(this.velocity.scale(t0));
					closest = [retLine, pos, t0];
				}
			}
		}
		return closest;
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