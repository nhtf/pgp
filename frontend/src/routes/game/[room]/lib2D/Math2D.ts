import { serialize, deserialize } from "../Math";

export function serializeNumber(num: number): string {
	const buffer = new Float64Array(1);
	buffer[0] = num;
	return serialize(buffer.buffer);
}

export function deserializeNumber(buf: string): number {
	const buffer = new Float64Array(deserialize(buf));
	return buffer[0];
}

export interface VectorObject {
	x: string;
	y: string;
}

export class Vector {
	public x: number;
	public y: number;

	public constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public add(other: Vector): Vector {
		return new Vector(this.x + other.x, this.y + other.y);
	}

	public sub(other: Vector): Vector {
		return new Vector(this.x - other.x, this.y - other.y);
	}

	public dot(other: Vector): number {
		return this.x * other.x + this.y * other.y;
	}

	public scale(scale: number): Vector {
		return new Vector(this.x * scale, this.y * scale);
	}

	public tangent(): Vector {
		return new Vector(-this.y, this.x);
	}

	public magnitude(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	public normalize(): Vector {
		return this.scale(1 / this.magnitude());
	}

	public reflect(line: Vector) {
		const normal = line.tangent().normalize();
		return this.add(normal.scale(this.dot(normal) * -2));
	}

	public save(): VectorObject {
		return {
			x: serializeNumber(this.x),
			y: serializeNumber(this.y),
		};
	}

	public static load(object: VectorObject): Vector {
		return new Vector(deserializeNumber(object.x), deserializeNumber(object.y));
	}
}

export function intersection(a: [Vector, Vector], b: [Vector, Vector]): [number, number] {
	const t1 = (a[1].x * (a[0].y - b[0].y) - a[1].y * (a[0].x - b[0].x)) / (a[1].x * b[1].y - b[1].x * a[1].y);
	const t0 = (b[1].x * (b[0].y - a[0].y) - b[1].y * (b[0].x - a[0].x)) / (b[1].x * a[1].y - a[1].x * b[1].y);
	return [t0, t1];
}

export function paddleBounce(line: { p0: Vector, p1: Vector }, ball: { position: Vector, velocity: Vector }): Vector {
	const center = line.p0.add(line.p1).scale(0.5);
	const distance = line.p0.sub(line.p1).magnitude();
	const offset = ball.position.sub(center).scale(1 / distance);
	return ball.velocity.normalize().add(offset).normalize();
}

export interface Line {
	p0: Vector,
	p1: Vector,
	name: string,
}

function compare(a: { x: number, y: number }, b: { x: number, y: number }): number {
	if (a.x == b.x)
		return a.y < b.y ? -1 : 1;
	return a.x < b.x ? -1 : 1;
}

function ccw(a: { x: number, y: number }, b: { x: number, y: number }, c: { x: number, y: number }) {
	let p = a.x * (b.y - c.y)
		+ b.x * (c.y - a.y)
		+ c.x * (a.y - b.y);
	return p > 0;
}

function cw(a: { x: number, y: number }, b: { x: number, y: number }, c: { x: number, y: number }) {
	let p = a.x * (b.y - c.y)
		+ b.x * (c.y - a.y)
		+ c.x * (a.y - b.y);
	return p < 0;
}

function convexHull(points: { x: number, y: number }[]) {
	points.sort((a, b) => {
		return compare(a, b);
	});
	let n = points.length;
	if (n <= 3)
		return points;
	
	let p1 = points[0];
	let p2 = points[n - 1];
	let up = [], down = [];
	up.push(p1);
	down.push(p1);

	for (let i = 0; i < n; i++) {
		if (i == n - 1 || !ccw(p1, points[i], p2)) {
			while (up.length > 1 && ccw(up[up.length - 2], up[up.length - 1], points[i])) {
				up.pop();
			}
		
			up.push(points[i]);
		}
		
		if (i == n - 1 || !cw(p1, points[i], p2)) {
		
		while (down.length > 1 && cw(down[down.length - 2],down[down.length - 1],points[i])) {
			down.pop();
		}
		down.push(points[i]);
		}
	}

	for (let i = down.length - 2; i > 0; i--)
		up.push(down[i]);
	let sup = new Set(up);
	up = Array.from(sup);
	return up;
}

//Also for lines themselves now
export function isInConvexHull(entityPos: { x: number, y: number }, lines: Line[], linePartOfHull: boolean) {
		let points = [];
		points.push(entityPos);
		for (let line of lines) {
			if ((entityPos.x === line.p0.x || entityPos.x === line.p1.x) && !linePartOfHull)
				return false; //On the line not inside
			if ((entityPos.y === line.p0.y || entityPos.y === line.p1.y) && !linePartOfHull)
				return false; //On the line not inside
			points.push(line.p0);
			points.push(line.p1);
		}
		points = convexHull(points);
		for (let p of points) {
			if (p === entityPos) {
				return false;
			}
		}
		return true;
}
