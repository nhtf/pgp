import type { VectorObject } from "../../lib2D/Math2D";
import { WIDTH, HEIGHT, FIELDWIDTH, FIELDHEIGHT } from "../Constants";

let VERT_RIP_SRC: string;
let FRAG_RIP_SRC: string;
let VERT_NOR_SRC: string;
let FRAG_NOR_SRC: string;
const path = "/Assets/Shaders/";
await fetch(path+"ripple.vert").then(r => r.text().then(d => VERT_RIP_SRC = d));
await fetch(path+"ripple.frag").then(r => r.text().then(d => FRAG_RIP_SRC = d));
await fetch(path+"normal.vert").then(r => r.text().then(d => VERT_NOR_SRC = d));
await fetch(path+"normal.frag").then(r => r.text().then(d => FRAG_NOR_SRC = d));

enum SHADER {
	NORMAL,
	RIPPLE
};

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
	}

	return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram()!;
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
	}

	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
	return program;
}

function createBuffer(gl: WebGLRenderingContext, data: number[]): WebGLBuffer {
	const buffer = gl.createBuffer()!;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	return buffer;
}

function createTexture(gl: WebGLRenderingContext): WebGLTexture {
	const texture = gl.createTexture()!;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	return texture;
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

export class RippleShader {
	private gl: WebGLRenderingContext;
	private outerCanvas: HTMLCanvasElement;
	private innerCanvas: HTMLCanvasElement;
	private program: WebGLProgram[] = [];
	private bufferPos: WebGLBuffer;
	private bufferCoord: WebGLBuffer;
	private texture: WebGLTexture;
	private uniformTex: WebGLUniformLocation[] = [];
	private uniformSize: WebGLUniformLocation[] = [];
	private uniformScale: WebGLUniformLocation[] = [];
    private timeLocation: WebGLUniformLocation[] = [];
	private originPos: WebGLUniformLocation[] = [];
	private shockParams: WebGLUniformLocation[] = [];
	private timer: number;
	private activeShader: SHADER;
	private lastTime: number;

	public constructor(canvas: HTMLCanvasElement) {
		this.outerCanvas = canvas;
		this.innerCanvas = document.createElement("canvas");
		this.gl = canvas.getContext("webgl2")!;
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

		this.program.push(createProgram(this.gl, VERT_NOR_SRC, FRAG_NOR_SRC));

		this.program.push(createProgram(this.gl, VERT_RIP_SRC, FRAG_RIP_SRC));

		this.timeLocation.push(this.gl.getUniformLocation(this.program[SHADER.NORMAL], "time")!);
		this.uniformTex.push(this.gl.getUniformLocation(this.program[SHADER.NORMAL], "tex")!);
		this.uniformSize.push(this.gl.getUniformLocation(this.program[SHADER.NORMAL], "size")!);
		this.uniformScale.push(this.gl.getUniformLocation(this.program[SHADER.NORMAL], "scale")!);
		this.originPos.push(this.gl.getUniformLocation(this.program[SHADER.NORMAL], "center")!);
		this.shockParams.push(this.gl.getUniformLocation(this.program[SHADER.NORMAL], "shockParams")!);

		this.timeLocation.push(this.gl.getUniformLocation(this.program[SHADER.RIPPLE], "time")!);
		this.uniformTex.push(this.gl.getUniformLocation(this.program[SHADER.RIPPLE], "tex")!);
		this.uniformSize.push(this.gl.getUniformLocation(this.program[SHADER.RIPPLE], "size")!);
		this.uniformScale.push(this.gl.getUniformLocation(this.program[SHADER.RIPPLE], "scale")!);
		this.originPos.push(this.gl.getUniformLocation(this.program[SHADER.RIPPLE], "center")!);
		this.shockParams.push(this.gl.getUniformLocation(this.program[SHADER.RIPPLE], "shockParams")!);

		this.bufferPos = createBuffer(this.gl, this.bufferPosData());
		this.bufferCoord = createBuffer(this.gl, [1, 1, 0, 1, 1, 0, 0, 0]);
		this.texture = createTexture(this.gl);
		this.timer = 0;
		this.activeShader = 0;
		this.lastTime = 0;
	}

	private scale(): number {
		const xScale = this.outerCanvas.width / this.innerCanvas.width;
		const yScale = this.outerCanvas.height / this.innerCanvas.height;
		return Math.floor(Math.min(xScale, yScale));
	}

	private bufferPosData(): number[] {
		const scale = this.scale();
		const xOffset = (this.outerCanvas.width - this.innerCanvas.width * scale) / 2;
		const yOffset = (this.outerCanvas.height - this.innerCanvas.height * scale) / 2;
		const x = xOffset / this.outerCanvas.width * 2 - 1;
		const y = yOffset / this.outerCanvas.height * 2 - 1;
		return [-x, -y, x, -y, -x, y, x, y];
	}

	public addEventListener(events: Events) {
		this.outerCanvas.addEventListener("mousemove", ev => {
			const xScale = Math.floor(this.outerCanvas.width / this.innerCanvas.width);
			const yScale = Math.floor(this.outerCanvas.height / this.innerCanvas.height);
			const minScale = Math.min(xScale, yScale);
			const x = ((ev.movementX) / minScale);
			const y = ((ev.movementY) / minScale);
			events.mousemove(x, y);
		});

        this.outerCanvas.addEventListener("wheel", ev => {
            const rotation = ev.deltaY / 16 * 2 * 0.01745329;
				events.mouseWheel(rotation);
			});
	}

	public getCanvas(): HTMLCanvasElement {
		return this.innerCanvas;
	}

	public update(time: number) {
		
		let refresh = false;

		if (this.outerCanvas.clientWidth != this.outerCanvas.width) {
			this.outerCanvas.width = this.outerCanvas.clientWidth;
			this.innerCanvas.width = this.outerCanvas.clientWidth;
			refresh = true;
		}

		if (this.outerCanvas.clientHeight != this.outerCanvas.height) {
			this.outerCanvas.height = this.outerCanvas.clientHeight;
			this.innerCanvas.height = this.outerCanvas.clientHeight;
			refresh = true;
		}

		this.gl.viewport(0, 0, this.outerCanvas.width, this.outerCanvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.innerCanvas); // TODO: deze functie is traaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaag
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferPos);

		if (refresh) {
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.bufferPosData()), this.gl.STATIC_DRAW);
		}
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferCoord);
		this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(0);
		this.gl.enableVertexAttribArray(1);
		
		
		if (active) {
			this.activeShader = SHADER.RIPPLE;
			this.timer += time - this.lastTime;
			if (this.timer > 500) {
				this.timer = 0;
				active = false;
				this.activeShader = SHADER.NORMAL;
			}
		}
		else {
			this.activeShader = SHADER.NORMAL;
		}
		this.gl.useProgram(this.program[this.activeShader]);
		this.gl.uniform3f(this.shockParams[this.activeShader], 10.0, 0.9, 0.1);
		this.gl.uniform1f(this.timeLocation[this.activeShader], this.timer * 0.0025);
		this.gl.uniform1i(this.uniformTex[this.activeShader], 0);
		this.gl.uniform2f(this.uniformSize[this.activeShader], this.innerCanvas.width, this.innerCanvas.height);
		this.gl.uniform2f(this.originPos[this.activeShader], position.x, position.y);
		this.gl.uniform1f(this.uniformScale[this.activeShader], this.scale());
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
		this.lastTime = time;
	}
}