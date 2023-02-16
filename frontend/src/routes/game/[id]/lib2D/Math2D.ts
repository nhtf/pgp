export interface VectorObject {
	x: number;
	y: number;
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
			x: this.x,
			y: this.y,
		};
	}

	public static load(object: VectorObject): Vector {
		return new Vector(object.x, object.y);
	}
}

export function intersection(a: [Vector, Vector], b: [Vector, Vector]): [number, number] {
	const t1 = (a[1].x * (a[0].y - b[0].y) - a[1].y * (a[0].x - b[0].x)) / (a[1].x * b[1].y - b[1].x * a[1].y);
	const t0 = (b[1].x * (b[0].y - a[0].y) - b[1].y * (b[0].x - a[0].x)) / (b[1].x * a[1].y - a[1].x * b[1].y);
	return [t0, t1];
}

export interface Line {
	p0: Vector,
	p1: Vector,
	name: string,
}
