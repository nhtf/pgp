import { HEIGHT, WIDTH } from "../Constants";
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

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_GRID_SRC, FRAG_GRID_SRC);
        this.scale = scale;
    }

    public updateScale(scale: number) {
        this.scale = scale;
        console.log("scale: ", this.scale);
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        //TODO maybe the width and height need to be resolution instead
        let uniform: uniforms = {pos: {x: 0, y: 0}, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time, resolution: {x: width, y: height}};
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        // console.log(uniform);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        this.program.useProgram(gl, uniform);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}