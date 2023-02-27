const VERTEX_SOURCE = `
attribute vec4 position;

varying highp vec2 tex;

void main() {
	tex = vec2(position / 2.0 + 0.5);
	gl_Position = position;
}
`;

const FRAGMENT_SOURCE = `
uniform sampler2D sampler;

varying highp vec2 tex;

void main() {
	gl_FragColor = texture2D(sampler, tex);
}
`;

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

function createBuffer(gl: WebGLRenderingContext): WebGLBuffer {
	const vertices = [-1, -1, 1, -1, -1, 1, 1, 1];
	const buffer = gl.createBuffer()!;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	return buffer;
}

function createTexture(gl: WebGLRenderingContext): WebGLTexture {
	const texture = gl.createTexture()!;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	return texture;
}

export class Shader {
	private gl: WebGLRenderingContext;
	private outerCanvas: HTMLCanvasElement;
	private innerCanvas: HTMLCanvasElement;
	private program: WebGLProgram;
	private buffer: WebGLBuffer;
	private texture: WebGLTexture;
	private uniformSampler: WebGLUniformLocation;

	public constructor(canvas: HTMLCanvasElement) {
		this.outerCanvas = canvas;
		this.innerCanvas = document.createElement("canvas");
		this.gl = canvas.getContext("webgl")!;
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		this.program = createProgram(this.gl, VERTEX_SOURCE, FRAGMENT_SOURCE);
		this.uniformSampler = this.gl.getUniformLocation(this.program, "sampler")!;
		this.buffer = createBuffer(this.gl);
		this.texture = createTexture(this.gl);
	}

	public getCanvas(): HTMLCanvasElement {
		return this.innerCanvas;
	}

	public update() {
		if (this.outerCanvas.clientWidth != this.outerCanvas.width) {
			this.outerCanvas.width = this.outerCanvas.clientWidth;
			this.innerCanvas.width = this.outerCanvas.clientWidth;
		}

		if (this.outerCanvas.clientHeight != this.outerCanvas.height) {
			this.outerCanvas.height = this.outerCanvas.clientHeight;
			this.innerCanvas.height = this.outerCanvas.clientHeight;
		}

		this.gl.viewport(0, 0, this.outerCanvas.width, this.outerCanvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.innerCanvas);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(0);
		this.gl.useProgram(this.program);
		this.gl.uniform1i(this.uniformSampler, 0);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
	}
}
