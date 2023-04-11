import type { VectorObject } from "../lib2D/Math2D";
import { WIDTH, HEIGHT, FIELDWIDTH, FIELDHEIGHT, scorePositions } from "./Constants";
import { m3 } from "../lib2D/Matrix";
import { Shader} from "./Shader";
import type { viewPort } from "./Shader";
import type { level } from "./Constants";

const ballSize = 7; //Visual size on the screen

export interface Events {
	mousemove(moveX: number, moveY: number): void;
    mouseWheel(deltaY: number): void;
	mouseClick(button: number):void;
}

let active = false;
export function activateRipple() {
	console.log("activating ripple");
	active = true;
}
let position: VectorObject = {x: 0, y: 0};
export function setOriginRipple(x: number, y: number) {
	position.x = (x + 40) / WIDTH;
	position.y = 1 - ((y + 22.5) / HEIGHT);
}

enum DebugVertices  {
	CONVEXHULL,
	PLAYERAREA,
	FIELDGOAL,
	PADDLE,
}

import { ballVert } from "./Shaders/ball.vert";
import { ballFrag } from "./Shaders/ball.frag";
import { paddleVert } from "./Shaders/paddle.vert";
import { paddleFrag } from "./Shaders/paddle.frag";
import { fieldVert } from "./Shaders/field.vert";
import { fieldFrag } from "./Shaders/field.frag";
import { gridVert } from "./Shaders/grid.vert";
import { gridFrag } from "./Shaders/grid.frag";
import { font, fontEdges } from "./Shaders/fonts";

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
	private minScale: number;
	private debugVertices: number[][];
	private scores: number[] = [];

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
		this.minScale = this.scale();
		
		this.timer = 0;
		this.lastTime = 0;
		this.ballPos = {x: 0, y: 0};

		for (let i = 0; i < level.players; i++) {
			this.paddlePos.push(level.paddleStartPos[i]);
			this.paddlePosCanvas.push({x: 0, y: 0});
			this.scores.push(0);
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

		this.debugVertices = this.getDebugVertices();
	}

	private getDebugVertices() {
		let debugVertices: number[][] = [];
		debugVertices.push([]);
		let collisionVertices: number[] = [];
		this.level.collisions.forEach((line) => {
			collisionVertices.push(line.p0.x + 60);
			collisionVertices.push(line.p0.y + 35);
			collisionVertices.push(line.p1.x + 60);
			collisionVertices.push(line.p1.y + 35);
		});
		debugVertices[DebugVertices.CONVEXHULL].push(...collisionVertices);

		debugVertices.push([]);
		let playerAreaCollisionLines: number[] = [];
		this.level.playerAreas.forEach((area) => {
			area.forEach((line) => {
				playerAreaCollisionLines.push(line.p0.x);
				playerAreaCollisionLines.push(line.p0.y);
				playerAreaCollisionLines.push(line.p1.x);
				playerAreaCollisionLines.push(line.p1.y);
			});
		});

		debugVertices[DebugVertices.PLAYERAREA].push(...playerAreaCollisionLines);

		debugVertices.push([]);
		let convexField: number[] = [];
		this.level.convexFieldBoxLines.forEach((line) => {
			convexField.push(line.p0.x + 60);
			convexField.push(line.p0.y + 35);
			convexField.push(line.p1.x + 60);
			convexField.push(line.p1.y + 35);
		});

		debugVertices[DebugVertices.FIELDGOAL].push(...convexField);
		debugVertices.push([]);
		debugVertices[DebugVertices.PADDLE].push(...this.level.paddleContour);
		return debugVertices;
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

		this.canvas.addEventListener("mousedown", ev => {
			events.mouseClick(ev.button);
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
		const otherPos = {x: (pos.x + (WIDTH - FIELDWIDTH) / 2) * this.minScale, y: (HEIGHT - pos.y - (HEIGHT - FIELDHEIGHT) / 2) * this.minScale};
		const morePos = {x: (otherPos.x) / (WIDTH * this.minScale / 2) - 1, y: (otherPos.y) / (HEIGHT * this.minScale / 2) - 1};
		this.paddlePos[paddleIndex] = morePos;
		this.paddlePosCanvas[paddleIndex] = pos;
	}

	public rotatePaddle(angle: number, paddleIndex: number) {
		this.paddleRot[paddleIndex] = angle;
	}

	public moveBall(pos: VectorObject) {
		const xOffset = Math.floor((this.canvas.width - WIDTH * this.minScale) / 2);
		const yOffset = Math.floor((this.canvas.height - HEIGHT * this.minScale) / 2);
		this.ballPos.x = (pos.x + (WIDTH - FIELDWIDTH) / 2) * this.minScale + xOffset;
		this.ballPos.y = (HEIGHT - pos.y - (HEIGHT - FIELDHEIGHT) / 2) * this.minScale + yOffset;
	}

	public updateScore(score: number, team: number) {
		this.scores[team] = score;
	}

	private renderMiddleLine() {
		this.field.renderNamed(this.gl, "circleBorder", {transform: this.level.normalMatrix});
		this.field.renderNamed(this.gl, "circleGradient");
		this.field.renderNamed(this.gl, "middleLineMesh");
		this.field.renderNamed(this.gl, "middleLineMesh", {transform: this.level.rotMatrix});
		if (this.level.players === 4) {
			this.field.renderNamed(this.gl, "middleLineMesh", {transform: this.level.middleLineMatrix[0]});
			this.field.renderNamed(this.gl, "middleLineMesh", {transform: this.level.middleLineMatrix[1]});
		}
	}

	private renderPaddles(time: number, viewport: viewPort, res: VectorObject) {
		this.paddleShader.setUniform(this.gl, time, viewport, this.ballPos, res);
		for (let i = 0; i < this.level.players; i++) {
			const mat = new m3();
			mat.translation(-WIDTH / 2, -HEIGHT / 2);
			mat.rotationZAxis(this.paddleRot[i]);
			mat.scaling(2 / WIDTH, 2 / HEIGHT);
			mat.translation(this.paddlePos[i].x, this.paddlePos[i].y);
			this.paddleShader.renderAll(this.gl, {transform: mat.matrix}, i);
		}
	}

	private renderPlayerFields(time: number, viewport: viewPort, res: VectorObject, ballRadius: number) {
		this.field.setUniform(this.gl, time, viewport, this.ballPos, res, {gradientRadius: {x: this.level.fieldGradientRadius.x * this.minScale, y: this.level.fieldGradientRadius.y * this.minScale}, ballRadius: ballRadius});
		for (let i = 0; i < this.level.players; i++) {
			this.field.renderNamed(this.gl, "fieldGradient", {transform: this.level.playerFieldMatrices[i]}, i);
			this.field.renderNamed(this.gl, "goalBorder", {transform: this.level.goalRot[i]},  i);	
			this.field.renderNamed(this.gl, "goalGradient", {}, i);
		}
		this.renderMiddleLine();
	}

	private renderBackGround(time: number, viewport: viewPort, res: VectorObject) {
		this.grid.setUniform(this.gl, time, viewport, this.ballPos, res);
		this.grid.renderNamed(this.gl, "grid");
	}

	private renderForeGround(time: number, viewport: viewPort, res: VectorObject) {
		this.renderPlayerFields(time, viewport, res, 15 * this.minScale);

		this.renderPaddles(time, viewport, res);
		
		this.ball.setUniform(this.gl, time, viewport, this.ballPos, res,  {size: {x: ballSize * this.minScale, y: ballSize * this.minScale}});
		this.ball.renderNamed(this.gl, "ball");

		this.field.setUniform(this.gl, time, viewport, this.ballPos, res);
		this.field.renderNamed(this.gl, "fieldBorder", {transform: this.level.normalMatrix});

		this.renderScore();
	}

	//TODO make the outline of the text better
	private renderScore() {
		for (let i = 0; i < this.level.players; i+=1) {
			const nIndex = Math.abs(this.scores[i] % 10);
			const matrix = new m3();
			matrix.translation(this.level.scorePositions[i].x - WIDTH / 2, (this.level.scorePositions[i].y) - HEIGHT / 2);
			matrix.scaling(2 / WIDTH, 2 / HEIGHT);
			
			if (Math.abs(this.scores[i]) < 10) {
				this.field.renderTriangles(this.gl, font[nIndex], matrix.matrix, this.level.scoreColors[i]);
				this.field.renderPoints(this.gl, fontEdges[nIndex], matrix.matrix, [1,1,1,1]);
			}
			else if (Math.abs(this.scores[i]) < 100) {	
				const tensIndex = Math.floor(Math.abs(this.scores[i] / 10));
				matrix.translation(-0.07, 0);
				this.field.renderTriangles(this.gl, font[tensIndex], matrix.matrix, this.level.scoreColors[i]);
				this.field.renderPoints(this.gl, fontEdges[tensIndex], matrix.matrix, [1,1,1,1]);
			}
			else {
				const tensIndex = Math.floor(Math.abs((this.scores[i] % 100) / 10));
				const hunIndex = Math.floor(Math.abs(this.scores[i] / 100));
				matrix.translation(-0.07, 0);
				this.field.renderTriangles(this.gl, font[tensIndex], matrix.matrix, this.level.scoreColors[i]);
				matrix.translation(-0.07, 0);
				this.field.renderTriangles(this.gl, font[hunIndex], matrix.matrix, this.level.scoreColors[i]);
				this.field.renderPoints(this.gl, fontEdges[hunIndex], matrix.matrix, [1,1,1,1]);
			}
		}
	}

	private debugRenderer(viewport: viewPort, res: VectorObject) {

		//Renders the collision for the field and goal lines
		this.field.renderPoints(this.gl, this.debugVertices[DebugVertices.CONVEXHULL], this.level.normalMatrix, [0, 0,1,1]);

		//Renders the convex shape for the fieldBorder
		this.field.renderPoints(this.gl, this.debugVertices[DebugVertices.FIELDGOAL], this.level.normalMatrix, [1, 1,1,1]);

		this.field.renderPoints(this.gl, this.debugVertices[DebugVertices.PLAYERAREA], this.level.debugMatrix, [1, 0,0,1]);

		this.paddleShader.setUniform(this.gl, 0, viewport, this.ballPos, res);
		//Renders the collision lines for all the paddles
		for (let i = 0; i < this.level.players; i++) {
			const mat = new m3();
			mat.translation(-WIDTH / 2, -HEIGHT / 2);
			mat.rotationZAxis(this.paddleRot[i]);
			mat.scaling(2 / WIDTH, 2 / HEIGHT);
			mat.translation(this.paddlePos[i].x, this.paddlePos[i].y);
			this.paddleShader.renderPoints(this.gl, this.debugVertices[DebugVertices.PADDLE], mat.matrix, [0, 1, 0, 1]);
		}
	}

	//TODO lerp/slerp the paddle (and ball?) for smoother motion
	public render(time: number) {
		let refresh = false;

		if (this.canvas.clientWidth != this.canvas.width) {
			this.canvas.width = this.canvas.clientWidth;
			refresh = true;
		}

		if (this.canvas.clientHeight != this.canvas.height) {
			this.canvas.height = this.canvas.clientHeight;
			refresh = true;
		}

		if (refresh)
			this.minScale = this.scale();

		const xOffset = Math.floor((this.canvas.width - WIDTH * this.minScale) / 2);
		const yOffset = Math.floor((this.canvas.height - HEIGHT * this.minScale) / 2);
		const viewport = {xOffset: xOffset, yOffset: yOffset, width: WIDTH * this.minScale, height: HEIGHT * this.minScale};
		const res = {x: this.canvas.width, y: this.canvas.height};

		this.gl.viewport(xOffset, yOffset, WIDTH * this.minScale, HEIGHT * this.minScale);		

		this.renderBackGround(time, viewport, res);
		this.renderForeGround(time, viewport, res)
		// this.debugRenderer(viewport, res);
		
		if (active) {
			console.log("active");
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
