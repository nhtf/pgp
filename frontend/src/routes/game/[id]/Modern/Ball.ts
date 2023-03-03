import { Vector, intersection } from "../lib2D/Math2D";
import type { VectorObject, Line, CollisionLine } from "../lib2D/Math2D";
import { FIELDWIDTH, FIELDHEIGHT, size, paddleStrokeC, paddleFillC, linethickness } from "./Constants";
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

	public render(context: CanvasRenderingContext2D) {
		const lastPos = positions[positions.length - 1];
		if (lastPos === undefined || (this.position.x !== lastPos.x && this.position.y !== lastPos.y)) {
			positions.push({x: this.position.x - size / 2, y: this.position.y - size / 2});
		}
		if (positions.length > 20)
			positions.shift();
		context.fillStyle = paddleFillC;
		context.strokeStyle = paddleStrokeC;
		context.lineWidth = linethickness;
		if (positions.length === 20) {
			context.beginPath();
			var grad= context.createLinearGradient(positions[0].x, positions[0].y, lastPos.x, lastPos.y);
			grad.addColorStop(0, `rgba(202, 209, 0, 0.05)`);
			grad.addColorStop(1, `rgba(222, 229, 19, 0.9)`);
			context.strokeStyle = grad;
			context.moveTo(positions[0].x, positions[0].y);
			positions.forEach((pos) => {
				context.lineTo(pos.x, pos.y);
			})
			context.stroke();
		}
		

		const posX = this.position.x;
		const posY = this.position.y;

		context.beginPath();
		context.fillStyle = paddleFillC;
		context.strokeStyle = paddleStrokeC;
		context.arc(posX - size / 2, posY - size / 2, size, 0, Math.PI * 2);
		context.fill();
		context.stroke();
	}

	public collision(lines: CollisionLine[]): [Line, Vector, number] | null {
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