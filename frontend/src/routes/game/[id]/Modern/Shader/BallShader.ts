import type { VectorObject } from "../../lib2D/Math2D";
import { createBuffer } from "./fullShader";
import { Program, type uniforms } from "./Program";

let VERT_BALL_SRC: string;
let FRAG_BALL_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"ball.vert").then(r => r.text().then(d => VERT_BALL_SRC = d));
await fetch(path+"ball.frag").then(r => r.text().then(d => FRAG_BALL_SRC = d));

const UniqueVertices = 4;
const ballSize = 8; //Visual size on the screen

export class BallShader {
    private bufferPos: WebGLBuffer;
	private bufferCoord: WebGLBuffer;
    private program: Program;
    private scale: number;
    private pos: VectorObject;

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_BALL_SRC, FRAG_BALL_SRC);
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
        this.bufferCoord = createBuffer(gl, [1, 1, 0, 1, 1, 0, 0, 0]);
        this.pos = {x: 0, y: 0};
    }

    //Vertex positions for the ball
    private bufferPosData(): number[] {
		const x = 0.5 * this.scale;
		const y = 0.5 * this.scale;
		return [-x, -y, x, -y, -x, y, x, y];
	}

    public updateBuffer(gl: WebGL2RenderingContext, scale: number) {
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.bufferPosData()), gl.STATIC_DRAW);
    }

    public moveBall(newPos: VectorObject) {
        this.pos.x = newPos.x;
        this.pos.y = newPos.y;
    }

    public render(gl: WebGL2RenderingContext, uniform: uniforms) {
        //where in the frame it should draw the ball and at what size
        // console.log("pos: ", this.pos);
        gl.viewport(this.pos.x - ballSize * this.scale / 2, this.pos.y - ballSize * this.scale / 2, ballSize * this.scale, ballSize * this.scale);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferCoord);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        uniform.pos.x = 1;//for centering the ball
        uniform.pos.y = 1;//for centering the ball
        this.program.useProgram(gl, uniform);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, UniqueVertices);
    }
}