import {
	FIELDWIDTH,
	FIELDHEIGHT,
	linethickness,
	color_border,
	b_r,
	border,
} from "./Constants";

import type { field, renderArc, gradient } from "./Constants";
import type { CollisionLine, Line } from "../lib2D/Math2D"
import { Vector } from "../lib2D/Math2D";

export class Field {
	public width: number;
	public height: number;
	// public renderLines: Line[][];
	public collisionLines: CollisionLine[];
	public convexFieldBoxLines: CollisionLine[];
	// public arcs: renderArc[];
	// public gradients: gradient[];
	public playerAreas: CollisionLine[][];

	public constructor(field: field) {
		this.width = field.width;
		this.height = field.height;
		// this.renderLines = field.lines;
		// this.arcs = field.arcs;
		// this.gradients = field.gradients;
		this.collisionLines = field.collisions;
		// this.convexFieldBoxLines = field.convexFieldBoxLines;
		this.convexFieldBoxLines = this.createCollisionLines(field);
		this.playerAreas = field.playerAreas;
	}

	private createCollisionLines(level: any) {
		let lines: CollisionLine[] = [];

		for (let i = 0; i < level.fieldContour.length;) {
			const p0 = new Vector(level.fieldContour[i], level.fieldContour[i + 1]);
			const p1 = new Vector(level.fieldContour[i + 2], level.fieldContour[i + 3]);
			const line = {p0: p0, p1: p1, name: `field-${(i + 4) / 4}`};

			const colLine: CollisionLine = {p0: line.p0, p1: line.p1, name: line.name, normal: (line.p1.sub(line.p0).tangent().normalize())};
			lines.push(colLine);
			i += 4;
		}
		console.log("convexFieldLines: ", lines);
		return lines;
	}

	// private drawGradients(context: CanvasRenderingContext2D) {
	// 	context.lineJoin = "round";
	// 	this.renderLines.forEach((area, j) => {
	// 		context.beginPath();
	// 		context.moveTo(area[0].p0.x, area[0].p0.y);
	// 		area.forEach((line) => {
	// 			context.lineTo(line.p1.x, line.p1.y);
	// 		});
	// 		const gradient = context.createRadialGradient(this.gradients[j].x0, this.gradients[j].y0, this.gradients[j].r0, this.gradients[j].x1, this.gradients[j].y1, this.gradients[j].r1);
	// 		gradient.addColorStop(1, this.gradients[j].c1);
	// 		gradient.addColorStop(0, this.gradients[j].c0);
	// 		context.fillStyle = gradient;
	// 		context.fill();
	// 	});
	// }

	// private drawBorder(context: CanvasRenderingContext2D) {
	// 	context.strokeStyle = color_border;
	// 	context.lineJoin = "round";
	// 	this.convexFieldBoxLines.forEach((line, i) => {
	// 		context.lineWidth = 2;
	// 		context.beginPath();
	// 		context.moveTo(line.p0.x, line.p0.y);
	// 		context.lineTo(line.p1.x, line.p1.y);
	// 		context.stroke();
	// 	});

	// 	this.arcs.forEach((arc) => {
	// 		context.lineWidth = 1.8;
	// 		context.beginPath();
	// 		context.arc(arc.pos.x, arc.pos.y, b_r, arc.angle1, arc.angle2);
	// 		context.stroke();
	// 	});
	// }

	// private drawMiddleLine(context: CanvasRenderingContext2D) {
    //     context.save();
    //     context.lineCap = 'square';
    //     context.strokeStyle = `rgba(200,200,200,0.9)`;
    //     context.fillStyle = 'rgba(100,100,100,1)';
    //     context.lineWidth = linethickness;
	// 	const r = 16;
	// 	const offset = (FIELDHEIGHT - this.height) / 2;
    //     context.beginPath();
    //     context.moveTo(this.width / 2, offset);
    //     context.lineTo(this.width / 2, FIELDHEIGHT / 2 - r);
    //     context.arc(this.width / 2, FIELDHEIGHT / 2, r, 1.5 * Math.PI,  0.5 * Math.PI);
    //     context.moveTo(this.width / 2, FIELDHEIGHT / 2 - r);
    //     context.arc(this.width / 2, FIELDHEIGHT / 2, r, 1.5 * Math.PI,  0.5 * Math.PI, true);
    //     context.fill();
    //     context.moveTo(this.width / 2, FIELDHEIGHT / 2 + r);
    //     context.lineTo(this.width / 2, this.height + offset);
    //     context.closePath();
    //     context.stroke();
    //     context.restore();
    // }

	// public render(context: CanvasRenderingContext2D) {
	// 	context.lineCap = 'round';
	// 	this.drawGradients(context);
	// 	this.drawBorder(context);
	// 	this.drawMiddleLine(context);
	// }

	// public renderCollisionLines(context: CanvasRenderingContext2D) {
	// 	context.lineCap = 'round';
	// 	context.strokeStyle = "red";
	// 	this.collisionLines.forEach((line, i) => {
	// 		context.beginPath();
	// 		context.moveTo(line.p0.x, line.p0.y);
	// 		context.lineTo(line.p1.x, line.p1.y);
	// 		context.stroke();
	// 	});
	// }

	// private renderPlayerArea(context: CanvasRenderingContext2D, area: CollisionLine[]) {
	// 	context.lineCap = 'round';
	// 	context.strokeStyle = "white";
	// 	area.forEach((line) => {
	// 		context.beginPath();
	// 		context.moveTo(line.p0.x, line.p0.y);
	// 		context.lineTo(line.p1.x, line.p1.y);
	// 		context.stroke();
	// 	});
	// }

	// public renderPlayerAreas(context: CanvasRenderingContext2D) {
		
	// 	this.playerAreas.forEach((area) => {
	// 		this.renderPlayerArea(context, area);
	// 	});

	// }

	// public renderConvexFieldBoxLines(context: CanvasRenderingContext2D) {
	// 	context.lineCap = 'round';
	// 	context.strokeStyle = "orange";
	// 	this.convexFieldBoxLines.forEach((line, i) => {
	// 		context.beginPath();
	// 		context.moveTo(line.p0.x, line.p0.y);
	// 		context.lineTo(line.p1.x, line.p1.y);
	// 		context.stroke();
	// 	});
	// }

	// public getCollisionLines() {
	// 	return this.collisionLines;
	// }

	public getConvexFieldBoxLines() {
		return this.convexFieldBoxLines;
	}

	public getPlayerAreas() {
		return this.playerAreas;
	}

	// public isInField(entityPos: Vector): boolean {
	// 	for (let line of this.collisionLines) {
	// 		const maxY = Math.max(line.p0.y, line.p1.y);
	// 		const minY = Math.min(line.p0.y, line.p1.y);
	// 		const maxX = Math.max(line.p0.x, line.p1.x);
	// 		const minX = Math.min(line.p0.x, line.p1.x);

	// 		if (line.normal.x > 0 && entityPos.x > line.p0.x && entityPos.y >= minY && entityPos.y <= maxY)
	// 			return false;
	// 		else if (line.normal.x < 0 && entityPos.x < line.p0.x && entityPos.y >= minY && entityPos.y <= maxY)
	// 			return false;
	// 		if (line.normal.y > 0 && entityPos.y > line.p0.y && entityPos.x >= minX && entityPos.x <= maxX)
	// 			return false;
	// 		else if (line.normal.y < 0 && entityPos.y < line.p0.y && entityPos.x >= minX && entityPos.x <= maxX)
	// 			return false;
	// 	}
	// 	return true;
	// }
}