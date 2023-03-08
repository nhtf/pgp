import { createBuffer } from "./fullShader";
import { Program, type uniforms } from "./Program";
import { WIDTH, HEIGHT } from "../Constants";

const UniqueVertices = 4;

//Maybe have this as a class to be used for all shaders? but how to make all the vertices ?
export class Shader {
    private bufferPos: WebGLBuffer;
	private bufferCoord: WebGLBuffer;
    private program: Program;
    private scale: number;

    constructor(gl: WebGL2RenderingContext, scale: number, vert: string, frag: string) {
        this.program = new Program(gl, vert, frag);
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
        this.bufferCoord = createBuffer(gl, [1, 1, 0, 1, 1, 0, 0, 0]);
    }

    //Vertex positions for the shader
    private bufferPosData(): number[] {
		const xOffset = (WIDTH * this.scale) / 2;
		const yOffset = (HEIGHT * this.scale) / 2;
		const x = xOffset / WIDTH * 2 - 1;
		const y = yOffset / HEIGHT * 2 - 1;
		return [-x, -y, x, -y, -x, y, x, y];
	}

    public updateBuffer(scale: number, gl: WebGL2RenderingContext) {
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.bufferPosData()), gl.STATIC_DRAW);
    }

    public render(gl: WebGL2RenderingContext, uniform: uniforms) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferCoord);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        this.program.useProgram(gl, uniform);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, UniqueVertices);
    }
}