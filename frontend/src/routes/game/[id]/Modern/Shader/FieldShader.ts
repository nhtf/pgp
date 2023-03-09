import { FIELDHEIGHT, FIELDWIDTH, HEIGHT, WIDTH } from "../Constants";
import { Program, type uniforms } from "./Program";
import { createBuffer } from "./fullShader";
// import {svgMesh3d} from "svg-mesh-3d";

let VERT_FIELD_SRC: string;
let FRAG_FIELD_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"field.vert").then(r => r.text().then(d => VERT_FIELD_SRC = d));
await fetch(path+"field.frag").then(r => r.text().then(d => FRAG_FIELD_SRC = d));

//TODO change vertices depending on the map
export class FieldShader {
    private program: Program;
    private scale: number;
    private bufferPos: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_FIELD_SRC, FRAG_FIELD_SRC);
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
    }

    public updateScale(scale: number) {
        this.scale = scale;
        console.log("scale: ", this.scale);
        // this.updateBuffer(gl);
    }

    private bufferPosData(): number[] {
        let vertices: number[] = [];
        const xCoords = new Array();
        const yCoords = new Array();

        // 0 is middle of the screen
        xCoords.push(-0.8);
        xCoords.push(0.0);
        xCoords.push(-0.8);

        xCoords.push(-0.8);
        xCoords.push(0.0);
        xCoords.push(0.0);

        yCoords.push(-0.8);
        yCoords.push(-0.8);
        yCoords.push(0.8);

        yCoords.push(0.8);
        yCoords.push(0.8);
        yCoords.push(-0.8);

        for (let i = 0; i < xCoords.length; i++) {
            vertices.push(xCoords[i]);
            vertices.push(yCoords[i]);
            console.log("xy: ", xCoords[i], yCoords[i]);
        }
        console.log(vertices.length);
        return vertices;
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        let uniform: uniforms = {pos: {x: 0, y:0}, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time};
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        this.program.useProgram(gl, uniform);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // gl.drawArrays(gl.LINE_LOOP, 0, 6);
    }
}