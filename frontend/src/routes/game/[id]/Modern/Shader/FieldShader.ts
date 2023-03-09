import { FIELDWIDTH, HEIGHT, WIDTH } from "../Constants";
import { Program, type uniforms } from "./Program";
import { createBuffer } from "./fullShader";

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
	private bufferCoord: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext, scale: number, width: number, height: number) {
        this.program = new Program(gl, VERT_FIELD_SRC, FRAG_FIELD_SRC);
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData(width, height));
		this.bufferCoord = createBuffer(gl, [1, 1, 0, 1, 1, 0, 0, 0]);
    }

    public updateScale(scale: number, gl: WebGL2RenderingContext, width: number, height: number) {
        this.scale = scale;
        this.updateBuffer(gl, width, height);
    }

    private bufferPosData(width: number, height: number): number[] {
        const xOffset = (width - WIDTH * this.scale) / 2 / width;
		const yOffset = (height - HEIGHT * this.scale) / 2 / height;
        console.log("offset: ", xOffset, yOffset);
        console.log("w, w*s", width, WIDTH * this.scale);
        let vertices: number[] = [];
        const xCoords = new Array();
        const yCoords = new Array();
        xCoords.push(xOffset + 5 / FIELDWIDTH);
        xCoords.push(xOffset + 160 / FIELDWIDTH);
        xCoords.push(xOffset + 5 / FIELDWIDTH);

        yCoords.push(yOffset + (HEIGHT - 175) * this.scale / height);
        yCoords.push(yOffset + (HEIGHT - 175) * this.scale / height);
        yCoords.push(yOffset + (HEIGHT - 5) * this.scale / height);

        for (let i = 0; i < xCoords.length; i++) {
            vertices.push(xCoords[i]);
            vertices.push(yCoords[i]);
            console.log("xy: ", xCoords[i], yCoords[i]);
        }
        
        return vertices;
    }

    private updateBuffer(gl: WebGL2RenderingContext, width: number, height: number) {
        this.bufferPos = createBuffer(gl, this.bufferPosData(width, height));
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        let uniform: uniforms = {pos: {x: 0, y:0}, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time};
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferCoord);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(1);
        this.program.useProgram(gl, uniform);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}