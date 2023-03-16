import { HEIGHT, WIDTH } from "../Constants";
import { createBuffer } from "./fullShader";
import { Program, type uniforms } from "./Program";

let VERT_GRID_SRC: string;
let FRAG_GRID_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"grid.vert").then(r => r.text().then(d => VERT_GRID_SRC = d));
await fetch(path+"grid.frag").then(r => r.text().then(d => FRAG_GRID_SRC = d));

//TODO make the grid behave better when scaling the window
export class GridShader {
    private program: Program;
    private scale: number;
    private bufferPos: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_GRID_SRC, FRAG_GRID_SRC);
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
    }

    public updateScale(scale: number) {
        this.scale = scale;
        console.log("scale: ", this.scale);
    }

    private bufferPosData(): number[] {
		const x = 1.0 * this.scale;
		const y = 1.0 * this.scale;
		return [-x, -y, x, -y, -x, y, x, y];
	}

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        //TODO maybe the width and height need to be resolution instead
        let uniform: uniforms = {pos: {x: 0, y: 0}, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time, resolution: {x: width, y: height}};
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        // console.log(uniform);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        this.program.useProgram(gl, uniform);


        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferCoord);
        // gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}