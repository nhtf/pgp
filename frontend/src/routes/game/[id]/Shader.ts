const VERTEX_SOURCE = `
attribute vec4 vertPos;
attribute vec2 vertCoord;

varying highp vec2 coord;

void main() {
	gl_Position = vertPos;
	coord = vertCoord;
}
`;

const FRAGMENT_SOURCE = `
#define GAMMA 2.4
#define BRIGHTNESS 1.5
#define GLOW_X 0.5
#define GLOW_Y 0.5
#define GLOW_HALATION 0.1
#define GLOW_DIFFUSION 0.05
#define SHARP_IMAGE 1.0
#define SHARP_EDGES 3.0
#define SCAN_MIN 0.5
#define SCAN_MAX 1.5
#define SCAN_SHAPE 2.5
#define SCAN_OFFSET 1.0
#define MASK_COLOR 2.0
#define MASK_STRENGTH 0.3
#define MASK_SIZE 1.0

uniform sampler2D tex;
uniform highp vec2 size;
uniform highp float scale;

varying highp vec2 coord;

highp vec4 pix(highp vec2 c) {
	highp vec4 col = texture2D(tex, c);
	return vec4(pow(col.rgb, vec3(GAMMA)), col.a);
}

highp vec3 gauss_dist(highp float d, highp float g) {
	highp vec3 r = vec3(d - 1.0, d, d + 1.0) * g;
	return exp2(r * -r);
}

highp vec4 gauss_row(highp vec2 c, highp vec2 ox, highp vec3 dx) {
	highp vec4 l = dx.x * pix(c - ox);
	highp vec4 m = dx.y * pix(c);
	highp vec4 r = dx.z * pix(c + ox);
	return (l + m + r) / (dx.x + dx.y + dx.z);
}

highp vec4 gauss(highp vec2 co) {
	highp vec2 c = (floor(co * size) + 0.5) / size;
	highp vec2 d = 0.5 - fract(co * size);
	highp vec2 ox = vec2(1.0 / size.x, 0.0);
	highp vec2 oy = vec2(0.0, 1.0 / size.y);
	highp vec3 dx = gauss_dist(d.x, 1.0 / GLOW_X);
	highp vec3 dy = gauss_dist(d.y, 1.0 / GLOW_Y);
	highp vec4 t = dy.x * gauss_row(c - oy, ox, dx);
	highp vec4 m = dy.y * gauss_row(c, ox, dx);
	highp vec4 b = dy.z * gauss_row(c + oy, ox, dx);
	return (t + m + b) / (dy.x + dy.y + dy.z);
}

highp vec4 lanczos(highp vec2 co, highp float sharp) {
	highp vec2 s = vec2(size.x * sharp, size.y);
	highp vec2 dx = vec2(1.0 / s.x, 0.0);
	highp vec2 p = co * s - vec2(0.5, 0.0);
	highp vec2 c = (floor(p) + vec2(0.5, 0.0)) / s;
	highp vec2 d = fract(p);
	highp vec4 f = 3.141592653589 * vec4(d.x + 1.0, d.x, d.x - 1.0, d.x - 2.0);

	f = max(abs(f), 1e-5);
	f = 2.0 * sin(f) * sin(f / 2.0) / (f * f);
	f /= f.x + f.y + f.z + f.w;

	highp vec4 c1 = pix(c);
	highp vec4 c2 = pix(c + dx);

	return mat4(c1, c1, c2, c2) * f;
}

highp vec4 scan_weight(highp float x, highp vec4 col) {
	highp vec4 beam = mix(vec4(SCAN_MIN), vec4(SCAN_MAX), pow(col, vec4(1.0 / SCAN_SHAPE)));
	highp vec4 x_mul = 2.0 / beam;
	highp vec4 x_offset = x_mul * 0.5;
	return smoothstep(0.0, 1.0, 1.0 - abs(x * x_mul - x_offset)) * x_offset;
}

highp vec4 mask_weight(highp float x) {
	highp float i = mod(floor(x * scale * size.x / MASK_SIZE), MASK_COLOR);

	if (i == 0.0) {
		return mix(vec4(1.0, 0.0, 1.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), MASK_COLOR - 2.0);
	} else if (i == 1.0) {
		return vec4(0.0, 1.0, 0.0, 1.0);
	} else {
		return vec4(0.0, 0.0, 1.0, 1.0);
	}
}

void main() {
	highp vec2 co = coord + vec2(0.0, 0.5 / size.y);
	highp vec4 glow = gauss(co);
	highp vec4 image = lanczos(co, SHARP_IMAGE);
	highp vec4 edges = lanczos(co, SHARP_EDGES);
	highp vec4 col = sqrt(image * edges);

	col *= vec4(vec3(scan_weight(fract(co.y * size.y), image)), 1.0);
	glow = clamp(glow - col, 0.0, 1.0);
	col += glow * glow * GLOW_HALATION;
	col = mix(col, col * mask_weight(co.x) * MASK_COLOR, MASK_STRENGTH);
	col += glow * GLOW_DIFFUSION;
	col *= BRIGHTNESS;

	gl_FragColor = vec4(pow(col.rgb, vec3(1.0 / GAMMA)), col.a);
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
	mousemove(offsetX: number, offsetY: number): void;
}

export class Shader {
	private gl: WebGLRenderingContext;
	private outerCanvas: HTMLCanvasElement;
	private innerCanvas: HTMLCanvasElement;
	private program: WebGLProgram;
	private bufferPos: WebGLBuffer;
	private bufferCoord: WebGLBuffer;
	private texture: WebGLTexture;
	private uniformTex: WebGLUniformLocation;
	private uniformSize: WebGLUniformLocation;
	private uniformScale: WebGLUniformLocation;

	public constructor(canvas: HTMLCanvasElement) {
		this.outerCanvas = canvas;
		this.innerCanvas = document.createElement("canvas");
		this.gl = canvas.getContext("webgl")!;
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.program = createProgram(this.gl, VERTEX_SOURCE, FRAGMENT_SOURCE);
		this.uniformTex = this.gl.getUniformLocation(this.program, "tex")!;
		this.uniformSize = this.gl.getUniformLocation(this.program, "size")!;
		this.uniformScale = this.gl.getUniformLocation(this.program, "scale")!;
		this.bufferPos = createBuffer(this.gl, this.bufferPosData());
		this.bufferCoord = createBuffer(this.gl, [1, 1, 0, 1, 1, 0, 0, 0]);
		this.texture = createTexture(this.gl);
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
			const xOffset = Math.floor((this.outerCanvas.width - this.innerCanvas.width * minScale) / 2);
			const yOffset = Math.floor((this.outerCanvas.height - this.innerCanvas.height * minScale) / 2);
			const x = Math.floor((ev.offsetX - xOffset) / minScale);
			const y = Math.floor((ev.offsetY - yOffset) / minScale);
			events.mousemove(x, y);
		});
	}

	public getCanvas(): HTMLCanvasElement {
		return this.innerCanvas;
	}

	public update() {
		let refresh = false;

		if (this.outerCanvas.clientWidth != this.outerCanvas.width) {
			this.outerCanvas.width = this.outerCanvas.clientWidth;
			refresh = true;
		}

		if (this.outerCanvas.clientHeight != this.outerCanvas.height) {
			this.outerCanvas.height = this.outerCanvas.clientHeight;
			refresh = true;
		}

		this.gl.viewport(0, 0, this.outerCanvas.width, this.outerCanvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.innerCanvas);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferPos);

		if (refresh) {
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.bufferPosData()), this.gl.STATIC_DRAW);
		}

		this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bufferCoord);
		this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(0);
		this.gl.enableVertexAttribArray(1);
		this.gl.useProgram(this.program);
		this.gl.uniform1i(this.uniformTex, 0);
		this.gl.uniform2f(this.uniformSize, this.innerCanvas.width, this.innerCanvas.height);
		this.gl.uniform1f(this.uniformScale, this.scale());
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
	}
}
