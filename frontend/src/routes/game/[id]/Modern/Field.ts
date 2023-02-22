import {
	FIELDWIDTH,
	FIELDHEIGHT,
	linethickness,
	color_border,
	b_r,
} from "./Constants";

import type { field, renderArc, gradient } from "./Constants";
import type { CollisionLine, Line, Vector } from "../lib2D/Math2D"

export class Field {
	public width: number;
	public height: number;
	public renderLines: Line[][];
	public collisionLines: CollisionLine[];
	public convexFieldBoxLines: CollisionLine[];
	public arcs: renderArc[];
	public gradients: gradient[];
	public gradientIndexs: boolean[];
	public playerAreas: CollisionLine[][];

	public constructor(field: field) {
		this.width = FIELDWIDTH;
		this.height = FIELDHEIGHT;
		this.renderLines = field.lines;
		this.arcs = field.arcs;
		this.gradients = field.gradients;
		this.gradientIndexs = field.gradientIndexs;
		this.collisionLines = field.collisions;
		this.convexFieldBoxLines = field.convexFieldBoxLines;
		this.playerAreas = field.playerAreas;
		console.log("field.lines: ", field.lines);
	}

	//TODO use the renderlines for the gradient and then for border just use the convexFieldBoxLines
	private drawGradients(context: CanvasRenderingContext2D) {
		context.lineJoin = "round";
		let i = 0;
		let k = 0;
		console.log(this.renderLines);
		this.renderLines.forEach((area, j) => {
			console.log(area);
			context.beginPath();
			context.moveTo(area[0].p0.x, area[0].p0.y);
			area.forEach((line) => {
				context.lineTo(line.p1.x, line.p1.y);
				if (this.gradientIndexs[i]) {
					console.log("gradient: ", i);
					const gradient = context.createRadialGradient(this.gradients[j].x0, this.gradients[j].y0, this.gradients[j].r0, this.gradients[j].x1, this.gradients[j].y1, this.gradients[j].r1);
					gradient.addColorStop(1, this.gradients[j].c1);
					gradient.addColorStop(0, this.gradients[j].c0);
					context.fillStyle = gradient;
					context.fill();
				}
				k = j;
				i += 1;
			})
		});
		const gradient = context.createRadialGradient(this.gradients[k].x0, this.gradients[k].y0, this.gradients[k].r0, this.gradients[k].x1, this.gradients[k].y1, this.gradients[k].r1);
		gradient.addColorStop(1, this.gradients[k].c1);
		gradient.addColorStop(0, this.gradients[k].c0);
		context.fillStyle = gradient;
		context.fill();
	}

	private drawBorder(context: CanvasRenderingContext2D) {
		context.strokeStyle = color_border;
		context.lineJoin = "round";
		this.convexFieldBoxLines.forEach((line, i) => {
			context.lineWidth = 2;
			context.beginPath();
			context.moveTo(line.p0.x, line.p0.y);
			context.lineTo(line.p1.x, line.p1.y);
			context.stroke();
		});

		this.arcs.forEach((arc) => {
			context.lineWidth = 1.8;
			context.beginPath();
			context.arc(arc.pos.x, arc.pos.y, b_r, arc.angle1, arc.angle2);
			context.stroke();
		});
	}

	public render(context: CanvasRenderingContext2D) {
		context.lineCap = 'round';
		this.drawGradients(context);
		this.drawBorder(context);
	}

	public renderCollisionLines(context: CanvasRenderingContext2D) {
		context.lineCap = 'round';
		context.strokeStyle = "red";
		this.collisionLines.forEach((line, i) => {
			context.beginPath();
			context.moveTo(line.p0.x, line.p0.y);
			context.lineTo(line.p1.x, line.p1.y);
			context.stroke();
		});
	}

	private renderPlayerArea(context: CanvasRenderingContext2D, area: CollisionLine[]) {
		context.lineCap = 'round';
		context.strokeStyle = "white";
		area.forEach((line) => {
			context.beginPath();
			context.moveTo(line.p0.x, line.p0.y);
			context.lineTo(line.p1.x, line.p1.y);
			context.stroke();
		});
	}

	public renderPlayerAreas(context: CanvasRenderingContext2D) {
		
		this.playerAreas.forEach((area) => {
			this.renderPlayerArea(context, area);
		});

	}

	public renderConvexFieldBoxLines(context: CanvasRenderingContext2D) {
		context.lineCap = 'round';
		context.strokeStyle = "orange";
		this.convexFieldBoxLines.forEach((line, i) => {
			context.beginPath();
			context.moveTo(line.p0.x, line.p0.y);
			context.lineTo(line.p1.x, line.p1.y);
			context.stroke();
		});
	}

	public getCollisionLines() {
		return this.collisionLines;
	}

	public getConvexFieldBoxLines() {
		return this.convexFieldBoxLines;
	}

	public getPlayerAreas() {
		return this.playerAreas;
	}

	public isInField(entityPos: Vector): boolean {
		for (let line of this.collisionLines) {
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
		return true;
	}
}