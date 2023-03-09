import type { VectorObject } from "../../lib2D/Math2D";
import { HEIGHT, WIDTH } from "../Constants";
import { Program } from "./Program";
import type {uniforms} from "./Program";

let VERT_BALL_SRC: string;
let FRAG_BALL_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"ball.vert").then(r => r.text().then(d => VERT_BALL_SRC = d));
await fetch(path+"ball.frag").then(r => r.text().then(d => FRAG_BALL_SRC = d));

const ballSize = 7; //Visual size on the screen

export class BallShader {
    private program: Program;
    private scale: number;
    private pos: VectorObject;

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_BALL_SRC, FRAG_BALL_SRC);
        this.scale = scale;
        this.pos = {x: 0, y: 0};
    }

    public updateScale(scale: number) {
        this.scale = scale;
    }

    public moveBall(newPos: VectorObject) {
        this.pos.x = newPos.x;
        this.pos.y = newPos.y;
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        let uniform: uniforms = {pos: this.pos, width: ballSize * this.scale, height: ballSize * this.scale, timer: time};
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        this.program.useProgram(gl, uniform);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}