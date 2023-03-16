import type { VectorObject } from "../../lib2D/Math2D";
import { WIDTH, HEIGHT, FIELDWIDTH, FIELDHEIGHT } from "../Constants";
import { BallShader } from "./BallShader";
import  { FieldShader } from "./FieldShader";
import { GridShader } from "./GridShader";
import { PaddleShader } from "./PaddleShader";

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

//TODO remake the debug renderer for the collisionlines
export class FullShader {
	private gl: WebGL2RenderingContext;
	private canvas: HTMLCanvasElement;
	private ballShader: BallShader;
	private gridShader: GridShader;
	private fieldShader: FieldShader;
	private paddleShader: PaddleShader;
	private timer: number;
	private lastTime: number;
	private ballPos: VectorObject;

	public constructor(canvas: HTMLCanvasElement, level: any) {
		this.canvas = canvas;
		this.gl = canvas.getContext("webgl2", {antialias: true})!;
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.ballShader = new BallShader(this.gl, this.scale());
		this.gridShader = new GridShader(this.gl, this.scale());
		this.fieldShader = new FieldShader(this.gl, this.scale(), level);
		this.paddleShader = new PaddleShader(this.gl, this.scale(), level);
		this.timer = 0;
		this.lastTime = 0;
		this.ballPos = {x: 0, y: 0};
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
		const morePos = {x: (otherPos.x) / (WIDTH * this.scale() / 2) - 1, y: (otherPos.y) / (HEIGHT * this.scale() / 2) - 1}
		this.paddleShader.movePaddle(morePos, paddleIndex);
	}

	public rotatePaddle(angle: number, paddleIndex: number) {
		this.paddleShader.rotatePaddle(angle, paddleIndex);
	}

	public moveBall(pos: VectorObject) {
		const xOffset = Math.floor((this.canvas.width - WIDTH * this.scale()) / 2);
		const yOffset = Math.floor((this.canvas.height - HEIGHT * this.scale()) / 2);
		this.ballPos.x = (pos.x + (WIDTH - FIELDWIDTH) / 2) * this.scale() + xOffset;
		this.ballPos.y = (HEIGHT - pos.y - (HEIGHT - FIELDHEIGHT) / 2) * this.scale() + yOffset;
		this.ballShader.moveBall(this.ballPos);
	}

	public update(time: number) {
		
		let refresh = false;
		if (this.canvas.clientWidth != this.canvas.width) {
			this.canvas.width = this.canvas.clientWidth;
			refresh = true;
		}

		if (this.canvas.clientHeight != this.canvas.height) {
			this.canvas.height = this.canvas.clientHeight;
			refresh = true;
		}

		//For clearing the whole screen
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		if (refresh) {
			const scale = this.scale();
			this.ballShader.updateScale(scale);
			this.gridShader.updateScale(scale);
			this.fieldShader.updateScale(scale);
			this.paddleShader.updateScale(scale);
			refresh = false;
		}

		this.gridShader.render(this.gl, time, this.canvas.width, this.canvas.height);
		this.fieldShader.render(this.gl, time, this.canvas.width, this.canvas.height, this.ballPos);
		this.ballShader.render(this.gl, time, this.canvas.width, this.canvas.height);
		this.fieldShader.renderFieldBorder(this.gl, time, this.canvas.width, this.canvas.height, this.ballPos);
		this.paddleShader.render(this.gl, time, this.canvas.width, this.canvas.height);
		
		
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
