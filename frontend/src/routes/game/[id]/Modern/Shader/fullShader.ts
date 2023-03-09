import type { VectorObject } from "../../lib2D/Math2D";
import { WIDTH, HEIGHT, FIELDWIDTH, FIELDHEIGHT } from "../Constants";
import { BallShader } from "./BallShader";
import  { FieldShader } from "./FieldShader";
import { GridShader } from "./GridShader";


enum SHADER {
	NORMAL,
	RIPPLE
};

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

//TODO do everything in shaders, split background up in grid and field shaders,
// split foreground up in seperate paddle and ball shaders
export class RippleShader {
	private gl: WebGL2RenderingContext;
	private outerCanvas: HTMLCanvasElement;
	private bufferPos: WebGLBuffer;
	private bufferCoord: WebGLBuffer;
	private ballShader: BallShader;
	private gridShader: GridShader;
	private fieldShader: FieldShader;
	private timer: number;
	private lastTime: number;

	public constructor(canvas: HTMLCanvasElement) {
		this.outerCanvas = canvas;
		// this.innerCanvas = document.createElement("canvas");
		this.gl = canvas.getContext("webgl2", {antialias: true})!;
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.ballShader = new BallShader(this.gl, this.scale());
		this.gridShader = new GridShader(this.gl, this.scale());
		this.fieldShader = new FieldShader(this.gl, this.scale(), this.outerCanvas.width, this.outerCanvas.height);
		this.timer = 0;
		this.lastTime = 0;
		this.bufferPos = createBuffer(this.gl, this.bufferPosData());
		this.bufferCoord = createBuffer(this.gl, [1, 1, 0, 1, 1, 0, 0, 0]);
		console.log(this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION));


		//Debug function
		this.outerCanvas.addEventListener("mousemove", ev => {
			// const xScale = Math.floor(this.outerCanvas.width / WIDTH);
			// const yScale = Math.floor(this.outerCanvas.height / HEIGHT);
			// const minScale = Math.min(xScale, yScale);
			// const x = ((ev.clientX) / minScale);
			// const y = HEIGHT * minScale - ((ev.clientY) / minScale);
			const x = Math.floor((ev.offsetX));
			const y = this.outerCanvas.height - Math.floor((ev.offsetY));

			this.ballShader.moveBall({x: x, y: y});
			// events.mousemove(x, y);
		});
	}

	private bufferPosData(): number[] {
		const x = 0.5 * this.scale();
		const y = 0.5 * this.scale();
		return [-x, -y, x, -y, -x, y, x, y];
	}

	private scale(): number {
		const xScale = this.outerCanvas.clientWidth / WIDTH;
		const yScale = this.outerCanvas.clientHeight / HEIGHT;
		return Math.floor(Math.min(xScale, yScale));
	}

	public addEventListener(events: Events) {
		this.outerCanvas.addEventListener("mousemove", ev => {
			const xScale = Math.floor(this.outerCanvas.width / WIDTH);
			const yScale = Math.floor(this.outerCanvas.height / HEIGHT);
			const minScale = Math.min(xScale, yScale);
			const x = ((ev.movementX) / minScale);
			const y = ((ev.movementY) / minScale);
			console.log("mousemove: ", ev.movementX, ev.movementY);
			this.ballShader.moveBall({x: x, y: y});
			events.mousemove(x, y);
		});

        this.outerCanvas.addEventListener("wheel", ev => {
            const rotation = ev.deltaY / 16 * 2 * 0.01745329;
				events.mouseWheel(rotation);
			});
	}

	public getCanvas(): HTMLCanvasElement {
		return this.outerCanvas;
	}

	public update(time: number) {
		
		let refresh = false;
		if (this.outerCanvas.clientWidth != this.outerCanvas.width) {
			this.outerCanvas.width = this.outerCanvas.clientWidth;
			refresh = true;
		}

		if (this.outerCanvas.clientHeight != this.outerCanvas.height) {
			this.outerCanvas.height = this.outerCanvas.clientHeight;
			refresh = true;
		}

		//For clearing the whole screen
		this.gl.viewport(0, 0, this.outerCanvas.width, this.outerCanvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		//Here need to update all the buffers
		if (refresh) {
			refresh = false;
			this.bufferPos = createBuffer(this.gl, this.bufferPosData());
			this.ballShader.updateScale(this.scale());
			this.gridShader.updateScale(this.scale());
			this.fieldShader.updateScale(this.scale(), this.gl, this.outerCanvas.width, this.outerCanvas.height);
		}
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferPos);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferCoord);
		this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(1);
		this.gridShader.render(this.gl, time, this.outerCanvas.width, this.outerCanvas.height);
		this.fieldShader.render(this.gl, time, this.outerCanvas.width, this.outerCanvas.height);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferPos);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferCoord);
		this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(1);
		this.ballShader.render(this.gl, time, this.outerCanvas.width, this.outerCanvas.height);
		
		
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
