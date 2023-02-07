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