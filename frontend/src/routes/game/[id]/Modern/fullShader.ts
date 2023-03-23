import type { VectorObject } from "../lib2D/Math2D";
import { WIDTH, HEIGHT, FIELDWIDTH, FIELDHEIGHT } from "./Constants";
import { m3 } from "../lib2D/Matrix";
import { Shader} from "./Shader";
import type { viewPort } from "./Shader";
import type { level } from "./Constants";

const ballSize = 7; //Visual size on the screen

export interface Events {
	mousemove(moveX: number, moveY: number): void;
    mouseWheel(deltaY: number): void;
}

let active = false;
export function activateRipple() {
	active = true;
}
let position: VectorObject = {x: 0, y: 0};
export function setOriginRipple(x: number, y: number) {
	position.x = (x + 40) / WIDTH;
	position.y = 1 - ((y + 22.5) / HEIGHT);
}

import { ballVert } from "./Shaders/ball.vert";
import { ballFrag } from "./Shaders/ball.frag";
import { paddleVert } from "./Shaders/paddle.vert";
import { paddleFrag } from "./Shaders/paddle.frag";
import { fieldVert } from "./Shaders/field.vert";
import { fieldFrag } from "./Shaders/field.frag";
import { gridVert } from "./Shaders/grid.vert";
import { gridFrag } from "./Shaders/grid.frag";

export class FullShader {
	private gl: WebGL2RenderingContext;
	private canvas: HTMLCanvasElement;
	private paddleShader: Shader;
	private timer: number;
	private lastTime: number;
	private ballPos: VectorObject;
	private paddlePos: VectorObject[] = [];
	private paddlePosCanvas: VectorObject[] = [];
	private paddleRot: number[] = [];
	private level;
	private field: Shader;
	private grid: Shader;
	private ball: Shader;

	public constructor(canvas: HTMLCanvasElement, level: level) {
		this.canvas = canvas;
		this.level = level;
		this.gl = canvas.getContext("webgl2", {antialias: true})!;
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.paddleShader = new Shader(this.gl, paddleVert, paddleFrag);
		this.field = new Shader(this.gl, fieldVert, fieldFrag);
		this.grid = new Shader(this.gl, gridVert, gridFrag);
		this.ball = new Shader(this.gl, ballVert, ballFrag);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
		
		this.timer = 0;
		this.lastTime = 0;
		this.ballPos = {x: 0, y: 0};

		for (let i = 0; i < level.players; i++) {
			this.paddlePos.push(level.paddleStartPos[i]);
			this.paddlePosCanvas.push({x: 0, y: 0});
		}
		this.paddleShader.addMesh(this.gl, level.paddleBorder, "paddleBorder", {color: level.paddleBorderColors});
		this.paddleShader.addMesh(this.gl, level.paddleGradient, "paddleGradient", {color: level.paddleGradientColors});

		this.field.addMesh(this.gl, level.fieldBorder, "fieldBorder", {color: [level.fieldBorderColor], gradient: false});
		this.field.addMesh(this.gl, level.fieldGradient, "fieldGradient", {color: level.fieldGradientColors, gradient: true, gradientPos: level.fieldGradientPos});
		this.field.addMesh(this.gl, level.goalBorder, "goalBorder", {color: level.goalBorderColors, gradient: false});
		this.field.addMesh(this.gl, level.goalGradient, "goalGradient", {color: level.goalGradientColors, gradient: false});
		this.field.addMesh(this.gl, level.circleBorder, "circleBorder", {color: [level.middleLineColor], gradient: false});
		this.field.addMesh(this.gl, level.circleGradient, "circleGradient", {color: [level.middleCircleColor], gradient: false});
		this.field.addMesh(this.gl, level.middleLineMesh, "middleLineMesh", {color: [level.middleLineColor], gradient: false});

		this.grid.addMesh(this.gl, {vertices: [-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1], indices: [0, 1, 2, 3, 4, 5]}, "grid");
		this.ball.addMesh(this.gl, {vertices: [-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1], indices: [0, 1, 2, 3, 4, 5]}, "ball");
	}

	private scale(): number {
		const xScale = this.canvas.clientWidth / WIDTH;
		const yScale = this.canvas.clientHeight / HEIGHT;
		return Math.floor(Math.min(xScale, yScale));
	}

	public addEventListener(events: Events) {
		this.canvas.addEventListener("mousemove", ev => {
			const xScale = Math.floor(this.canvas.width / WIDTH);
			const yScale = Math.floor(this.canvas.height / HEIGHT);
			const minScale = Math.min(xScale, yScale);
			const x = ((ev.movementX) / minScale);
			const y = ((ev.movementY) / minScale);
			events.mousemove(x, y);
		});

        this.canvas.addEventListener("wheel", ev => {
            const rotation = ev.deltaY / 16 * 2 * 0.01745329;
				events.mouseWheel(rotation);
			});
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}

	public movePaddle(pos: VectorObject, paddleIndex: number) {
		const otherPos = {x: (pos.x + (WIDTH - FIELDWIDTH) / 2) * this.scale(), y: (HEIGHT - pos.y - (HEIGHT - FIELDHEIGHT) / 2) * this.scale()};
		const morePos = {x: (otherPos.x) / (WIDTH * this.scale() / 2) - 1, y: (otherPos.y) / (HEIGHT * this.scale() / 2) - 1};
		this.paddlePos[paddleIndex] = morePos;
		this.paddlePosCanvas[paddleIndex] = pos;
	}

	public rotatePaddle(angle: number, paddleIndex: number) {
		this.paddleRot[paddleIndex] = angle;
	}

	public moveBall(pos: VectorObject) {
		const xOffset = Math.floor((this.canvas.width - WIDTH * this.scale()) / 2);
		const yOffset = Math.floor((this.canvas.height - HEIGHT * this.scale()) / 2);
		this.ballPos.x = (pos.x + (WIDTH - FIELDWIDTH) / 2) * this.scale() + xOffset;
		this.ballPos.y = (HEIGHT - pos.y - (HEIGHT - FIELDHEIGHT) / 2) * this.scale() + yOffset;
	}

	private renderMiddleLine(time: number, viewport: viewPort, res: VectorObject, ballRadius: number) {
		const normal = new m3();
		normal.translation(-WIDTH / 2, -HEIGHT / 2);
		normal.scaling(2 / WIDTH, 2 / HEIGHT);
		this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "circleBorder", {transform: normal, ballRadius: ballRadius});
		this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "circleGradient", {transform: normal, ballRadius: ballRadius});
		this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "middleLineMesh", {transform: normal, ballRadius: ballRadius});

		normal.rotationZAxis(Math.PI);
		this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "middleLineMesh", {transform: normal, ballRadius: ballRadius});
		if (this.level.players === 4) {
			normal.rotationZAxis(Math.PI / 2);
			normal.scaling(1.073, 1.25);
			normal.translation(-24/440, 0);
			this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "middleLineMesh", {transform: normal, ballRadius: ballRadius});
			normal.rotationZAxis(Math.PI);
			this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "middleLineMesh", {transform: normal, ballRadius: ballRadius});
		}
	}

	private renderPaddles(time: number, viewport: viewPort, res: VectorObject) {
		for (let i = 0; i < this.level.players; i++) {
			const mat = new m3();
			mat.translation(-WIDTH / 2, -HEIGHT / 2);
			mat.rotationZAxis(this.paddleRot[i]);
			mat.scaling(2 / WIDTH, 2 / HEIGHT);
			mat.translation(this.paddlePos[i].x, this.paddlePos[i].y);
			this.paddleShader.renderAll(this.gl, time, viewport, this.paddlePos[i], res, {transform: mat}, i);
		}
	}

	private renderPlayerFields(time: number, viewport: viewPort, res: VectorObject, ballRadius: number) {
		for (let i = 0; i < this.level.players; i++) {
			
			const matField = new m3();
			matField.translation(-WIDTH / 2, -HEIGHT / 2);
			matField.rotationZAxis(this.level.fieldGradientRot[i].z);
			matField.rotationXAxis(this.level.fieldGradientRot[i].x);
			matField.scaling(2 / WIDTH, 2 / HEIGHT);
			this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "fieldGradient", {transform: matField, gradientRadius: {x: this.level.fieldGradientRadius.x * this.scale(), y: this.level.fieldGradientRadius.y * this.scale()}, ballRadius: ballRadius }, i);	
			this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "goalBorder", {transform: matField, ballRadius: ballRadius}, i);	
			this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "goalGradient", {transform: matField, ballRadius: ballRadius}, i);
		}
	}

	private debugRenderer(viewport: viewPort, res: VectorObject) {
		const normal = new m3();
		normal.translation(-WIDTH / 2, -HEIGHT / 2);
		normal.scaling(2 / WIDTH, 2 / HEIGHT);

		let collisionVertices: number[] = [];
		this.level.collisions.forEach((line) => {
			collisionVertices.push(line.p0.x + 60);
			collisionVertices.push(line.p0.y + 35);
			collisionVertices.push(line.p1.x + 60);
			collisionVertices.push(line.p1.y + 35);
		});

		let playerAreaCollisionLines: number[] = [];
		this.level.playerAreas.forEach((area) => {
			area.forEach((line) => {
				playerAreaCollisionLines.push(line.p0.x);
				playerAreaCollisionLines.push(line.p0.y);
				playerAreaCollisionLines.push(line.p1.x);
				playerAreaCollisionLines.push(line.p1.y);
			});
		});

		let convexField: number[] = [];
		this.level.convexFieldBoxLines.forEach((line) => {
			convexField.push(line.p0.x + 60);
			convexField.push(line.p0.y + 35);
			convexField.push(line.p1.x + 60);
			convexField.push(line.p1.y + 35);
		});

		//Renders the collision for the field and goal lines
		this.field.renderPoints(this.gl, collisionVertices, 0, viewport, this.ballPos, res, normal, [0, 0,1,1]);

		//Renders the convex shape for the fieldBorder
		this.field.renderPoints(this.gl, convexField, 0, viewport, this.ballPos, res, normal, [1, 1,1,1]);

		normal.translation(+ 120/WIDTH, 70 / HEIGHT);
		this.field.renderPoints(this.gl, playerAreaCollisionLines, 0, viewport, this.ballPos, res, normal, [1, 0,0,1]);

		//Renders the collision lines for all the paddles
		for (let i = 0; i < this.level.players; i++) {
			const mat = new m3();
			mat.translation(-WIDTH / 2, -HEIGHT / 2);
			mat.rotationZAxis(this.paddleRot[i]);
			mat.scaling(2 / WIDTH, 2 / HEIGHT);
			mat.translation(this.paddlePos[i].x, this.paddlePos[i].y);
			this.paddleShader.renderPoints(this.gl, this.level.paddleContour, 0, viewport, this.paddlePos[i], res, mat, [0, 1, 0, 1]);
		}
	}

	//TODO lerp/slerp the paddle (and ball?) for smoother motion
	public render(time: number) {
		
		if (this.canvas.clientWidth != this.canvas.width) {
			this.canvas.width = this.canvas.clientWidth;
		}

		if (this.canvas.clientHeight != this.canvas.height) {
			this.canvas.height = this.canvas.clientHeight;
		}

		//For clearing the whole screen
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		const scale = this.scale();
		const xOffset = Math.floor((this.canvas.width - WIDTH * scale) / 2);
		const yOffset = Math.floor((this.canvas.height - HEIGHT * scale) / 2);
		const viewport = {xOffset: xOffset, yOffset: yOffset, width: WIDTH * scale, height: HEIGHT * scale};
		const ballRadius = 15 * scale;
		const res = {x: this.canvas.width, y: this.canvas.height};
		const normal = new m3();
		normal.translation(-WIDTH / 2, -HEIGHT / 2);
		normal.scaling(2 / WIDTH, 2 / HEIGHT);

		this.grid.renderAll(this.gl, time, viewport, this.ballPos, res);

		this.renderPlayerFields(time, viewport, res, ballRadius);
		this.renderMiddleLine(time, viewport, res, ballRadius);

		this.renderPaddles(time, viewport, res);
		
		this.ball.renderAll(this.gl, time, viewport, this.ballPos, res,  {size: {x: ballSize * scale, y: ballSize * scale}});

		this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "fieldBorder", {transform: normal,  ballRadius: ballRadius});

		// this.debugRenderer(viewport, res);
		
		if (active) {
			this.timer += time - this.lastTime;
			if (this.timer > 500) {
				this.timer = 0;
				active = false;
			}
		}
		const fps = 1/ (time -this.lastTime) * 1000;
		// console.log("fps: ", fps);
		this.lastTime = time;
	}
}
