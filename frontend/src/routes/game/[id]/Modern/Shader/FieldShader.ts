import { FIELDHEIGHT, FIELDWIDTH, HEIGHT, WIDTH } from "../Constants";
import { Program, type uniforms } from "./Program";
import { createBuffer } from "./fullShader";
import { parse } from "$lib/svgMesh/parseSvgPath";
import { contours } from "$lib/svgMesh/svgPathContours";
import { triangulate } from "$lib/svgMesh/triangulateContours";
// import svgMesh3d from "svg-mesh-3d";


let VERT_FIELD_SRC: string;
let FRAG_FIELD_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"field.vert").then(r => r.text().then(d => VERT_FIELD_SRC = d));
await fetch(path+"field.frag").then(r => r.text().then(d => FRAG_FIELD_SRC = d));

//TODO get the svg depending on map type
//TODO now it only does the border of the field
export class FieldShader {
    private program: Program;
    private scale: number;
    private bufferPos: WebGLBuffer;
    private indices: number[];
    private contour: number[][][];
    private triangles: any;

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_FIELD_SRC, FRAG_FIELD_SRC);
        this.scale = scale;
        let svg = parse("m70,35l300,0l0,5l-300,0l0,-5zM70,210l300,0l0,5l-300,0l0,-5zM60,45l5,0l0,160l-5,0l0,-160zM375,45l5,0l0,160l-5,0l0,-160zM60,45c0,-5.43379 4.56621,-10 10,-10l0,5c-2.56295,0.06615 -4.93385,1.28468 -5,5l-5,0z");
        // let svg = parse("m60,45c0,-5.43379 4.56621,-10 10,-10l300,0c5.43379,0 10,4.56621 10,10l0,160c0,5.43379 -4.56621,10 -10,10l-300,0c-5.43379,0 -10,-4.56621 -10,-10l0,-160z");
        this.indices = [];
        this.contour = contours(svg, 1);
        this.triangles = triangulate(this.contour);
        this.bufferPos = createBuffer(gl, this.bufferPosData());
        // console.log("triangulate: ", triangulate(this.contour));
    }

    public updateScale(scale: number) {
        this.scale = scale;
    }

    private bufferPosData(): number[] {
        let vertices: number[] = [];
        // const xCoords = new Array();
        // const yCoords = new Array();

        // // 0 is middle of the screen
        // xCoords.push(-0.8);
        // xCoords.push(0.0);
        // xCoords.push(-0.8);

        // xCoords.push(-0.8);
        // xCoords.push(0.0);
        // xCoords.push(0.0);

        // yCoords.push(-0.8);
        // yCoords.push(-0.8);
        // yCoords.push(0.8);

        // yCoords.push(0.8);
        // yCoords.push(0.8);
        // yCoords.push(-0.8);

        // for (let i = 0; i < this.contour[0].length; i++) {
        //     let x = this.contour[0][i][0] / WIDTH * 2 - 1;
        //     let y = this.contour[0][i][1] / HEIGHT * 2 - 1;
        //     vertices.push(x);
        //     vertices.push(y);
        //     // if (this.contour[0][i][0] / WIDTH * 2 - 1 > 0 || this.contour[0][i][1] / HEIGHT * 2 - 1 > 0)
        //         // console.log("vertice: ", [x, y]);
        //     // console.log("xy: ", xCoords[i], yCoords[i]);
        // }
        for (let i = 0; i < this.triangles.positions.length; i++) {
            let x = this.triangles.positions[i][0] / WIDTH * 2 - 1;
            let y = this.triangles.positions[i][1] / HEIGHT * 2 - 1;
            vertices.push(x);
            vertices.push(y);
            
            // if (this.contour[0][i][0] / WIDTH * 2 - 1 > 0 || this.contour[0][i][1] / HEIGHT * 2 - 1 > 0)
                // console.log("vertice: ", [x, y]);
            // console.log("xy: ", xCoords[i], yCoords[i]);
        }
        for (let i = 0; i < this.triangles.cells.length; i++) {
            this.indices.push(this.triangles.cells[i][0]);
            this.indices.push(this.triangles.cells[i][1]);
            this.indices.push(this.triangles.cells[i][2]);
        }
        console.log("vertices: ", vertices);
        this.verticeLength = vertices.length / 2;
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
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, createBuffer(gl, this.indices));
        this.program.useProgram(gl, uniform);
        // console.log(this.indices.length);
        // gl.drawArrays(gl.LINE_STRIP, 0, this.verticeLength!);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        // gl.drawArrays(gl.LINE_LOOP, 0, 6);
    }
}