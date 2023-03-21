import type { level } from "./Constants";
import type { Line } from "../lib2D/Math2D"
import { Vector } from "../lib2D/Math2D";

export class Field {
	public width: number;
	public height: number;
	public collisionLines: Line[];
	public convexFieldBoxLines: Line[];
	public playerAreas: Line[][];

	public constructor(field: level) {
		this.width = field.width;
		this.height = field.height;
		this.collisionLines = field.collisions;
		this.convexFieldBoxLines = field.convexFieldBoxLines;
		this.playerAreas = field.playerAreas;
	}

	public getConvexFieldBoxLines() {
		return this.convexFieldBoxLines;
	}

	public getCollisionLines() {
		return this.collisionLines;
	}

	public getPlayerAreas() {
		return this.playerAreas;
	}
}