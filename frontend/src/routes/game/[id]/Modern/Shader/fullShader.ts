import type { VectorObject } from "../../lib2D/Math2D";
import { WIDTH, HEIGHT, FIELDWIDTH, FIELDHEIGHT } from "../Constants";
import { m3 } from "../Matrix";
import { Shader} from "../Shader";
import type { viewPort } from "../Shader";

const ballSize = 7; //Visual size on the screen

export function createBuffer(gl: WebGLRenderingContext, data: number[]): WebGLBuffer {
	const buffer = gl.createBuffer()!;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	return buffer;
}

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

const path = "/Assets/Shaders/";
let VERT_PADDLE_SRC: string;
let FRAG_PADDLE_SRC: string;
let VERT_FIELD_SRC: string;
let FRAG_FIELD_SRC: string;
let VERT_GRID_SRC: string;
let FRAG_GRID_SRC: string;
let VERT_BALL_SRC: string;
let FRAG_BALL_SRC: string;
await fetch(path+"paddle.vert").then(r => r.text().then(d => VERT_PADDLE_SRC = d));
await fetch(path+"paddle.frag").then(r => r.text().then(d => FRAG_PADDLE_SRC = d));
await fetch(path+"field.vert").then(r => r.text().then(d => VERT_FIELD_SRC = d));
await fetch(path+"field.frag").then(r => r.text().then(d => FRAG_FIELD_SRC = d));
await fetch(path+"grid.vert").then(r => r.text().then(d => VERT_GRID_SRC = d));
await fetch(path+"grid.frag").then(r => r.text().then(d => FRAG_GRID_SRC = d));
await fetch(path+"ball.vert").then(r => r.text().then(d => VERT_BALL_SRC = d));
await fetch(path+"ball.frag").then(r => r.text().then(d => FRAG_BALL_SRC = d));

//TODO remake the debug renderer for the collisionlines
export class FullShader {
	private gl: WebGL2RenderingContext;
	private canvas: HTMLCanvasElement;
	private paddleShader: Shader;
	private timer: number;
	private lastTime: number;
	private ballPos: VectorObject;
	private paddlePos: VectorObject[] = [];
	private paddleRot: number[] = [];
	private level;
	private field: Shader;
	private grid: Shader;
	private ball: Shader;

	public constructor(canvas: HTMLCanvasElement, level: any) {
		this.canvas = canvas;
		this.level = level;
		this.gl = canvas.getContext("webgl2", {antialias: true})!;
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.paddleShader = new Shader(this.gl, VERT_PADDLE_SRC, FRAG_PADDLE_SRC);
		this.field = new Shader(this.gl, VERT_FIELD_SRC, FRAG_FIELD_SRC);
		this.grid = new Shader(this.gl, VERT_GRID_SRC, FRAG_GRID_SRC);
		this.ball = new Shader(this.gl, VERT_BALL_SRC, FRAG_BALL_SRC);
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.createBuffer());
		
		this.timer = 0;
		this.lastTime = 0;
		this.ballPos = {x: 0, y: 0};

		for (let i = 0; i < level.players; i++) {
			this.paddlePos.push(level.paddleStartPos[i]);
		}
		this.paddleShader.addMesh(this.gl, level.paddleBorder, "paddleBorder", {color: level.paddleBorderColors});
		this.paddleShader.addMesh(this.gl, level.paddleGradient, "paddleGradient", {color: level.paddleGradientColors});

		this.field.addMesh(this.gl, level.fieldBorder, "fieldBorder", {color: [level.fieldBorderColor]});
		this.field.addMesh(this.gl, level.fieldGradient, "fieldGradient", {color: level.fieldGradientColors, gradient: true, gradientPos: level.fieldGradientPos});
		this.field.addMesh(this.gl, level.goalBorder, "goalBorder", {color: level.goalBorderColors});
		this.field.addMesh(this.gl, level.goalGradient, "goalGradient", {color: level.goalGradientColors});
		this.field.addMesh(this.gl, level.circleBorder, "circleBorder", {color: [level.middleLineColor]});
		this.field.addMesh(this.gl, level.circleGradient, "circleGradient", {color: [level.middleCircleColor]});
		this.field.addMesh(this.gl, level.middleLineMesh, "middleLineMesh", {color: [level.middleLineColor]});

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

		this.renderPaddles(time, viewport, res);
		
		this.renderMiddleLine(time, viewport, res, ballRadius);
		
		this.ball.renderAll(this.gl, time, viewport, this.ballPos, res,  {size: {x: ballSize * scale, y: ballSize * scale}});
		this.field.renderNamed(this.gl, time, viewport, this.ballPos, res, "fieldBorder", {transform: normal,  ballRadius: ballRadius});
		
		if (active) {
			this.timer += time - this.lastTime;
			if (this.timer > 500) {
				this.timer = 0;
				active = false;
			}
		}
		const fps = 1/ (time -this.lastTime) * 1000;
		console.log("fps: ", fps);
		this.lastTime = time;
	}
}
