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


const pathBorder2players = "m60,45c0,-5.43 4.57,-10 10,-10l300,0c5.43,0 10,4.57 10,10l0,160c0,5.43 -4.57,10 -10,10l-300,0c-5.43,0 -10,-4.57 -10,-10l0,-160zm2.5,0.5c0,-4.35 3.65,-8 8,-8l299,0c4.35,0 8,3.65 8,8l0,159c0,4.35 -3.65,8 -8,8l-299,0c-4.35,0 -8,-3.65 -8,-8l0,-159z";
const goalBorder1 = "M43.97,95.5c0,-1.63 1.37,-3 3,-3l9,0c1.63,0 3,1.37 3,3l0,59c0,1.63 -1.37,3 -3,3l-9,0c-1.63,0 -3,-1.37 -3,-3l0,-59zM45.25,95.75c0,-1.09 0.91,-2 2,-2l8.5,0c1.09,0 2,0.91 2,2l0,58.5c0,1.09 -0.91,2 -2,2l-8.5,0c-1.09,0 -2,-0.91 -2,-2l0,-58.5z"
const borders = pathBorder2players + goalBorder1;
//TODO get the triangulate data from a file instead of making this at runtime

type triangles = {
    positions: number[][];
    cells: number[][];
}

//TODO have it also do the gradients and do it in as few drawCalls as possible
export class FieldShader {
    private program: Program;
    private scale: number;
    private bufferPos: WebGLBuffer;
    private otherPos: WebGLBuffer;
    private borderindices: number[];
    private goalleftIndices: number[];

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_FIELD_SRC, FRAG_FIELD_SRC);
        this.scale = scale;
        let borderSvg = parse(borders);
        // let svg = parse("m60,45c0,-5.43379 4.56621,-10 10,-10l300,0c5.43379,0 10,4.56621 10,10l0,160c0,5.43379 -4.56621,10 -10,10l-300,0c-5.43379,0 -10,-4.56621 -10,-10l0,-160z");
        this.borderindices = [];
        let borderContour = contours(borderSvg, 1);
        console.log(borderContour);
        let borderTriangles = triangulate(borderContour);
        this.bufferPos = createBuffer(gl, this.bufferPosData(borderTriangles, this.borderindices));

        let goalSvg = parse(goalBorder1);
        // let svg = parse("m60,45c0,-5.43379 4.56621,-10 10,-10l300,0c5.43379,0 10,4.56621 10,10l0,160c0,5.43379 -4.56621,10 -10,10l-300,0c-5.43379,0 -10,-4.56621 -10,-10l0,-160z");
        this.goalleftIndices = [];
        let goalContour = contours(goalSvg, 1);
        console.log(goalContour);
        let goalTriangles = triangulate(goalContour);

        this.otherPos = createBuffer(gl, this.bufferPosData(goalTriangles, this.goalleftIndices));
        // console.log("triangulate: ", triangulate(this.contour));
    }

    public updateScale(scale: number) {
        this.scale = scale;
    }

    private bufferPosData(triangles: triangles, indices: number[]): number[] {
        let vertices: number[] = [];
        for (let i = 0; i < triangles.positions.length; i++) {
            let x = triangles.positions[i][0] / WIDTH * 2 - 1;
            let y = triangles.positions[i][1] / HEIGHT * 2 - 1;
            vertices.push(x);
            vertices.push(y);
        }
        for (let i = 0; i < triangles.cells.length; i++) {
            indices.push(triangles.cells[i][0]);
            indices.push(triangles.cells[i][1]);
            indices.push(triangles.cells[i][2]);
        }
        return vertices;
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        let uniform: uniforms = {pos: {x: 0, y:0}, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time};
        uniform.color = [222/255, 229/255, 19/255, 0.9];
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.borderindices), gl.STATIC_DRAW);
        this.program.useProgram(gl, uniform);
        gl.drawElements(gl.TRIANGLES, this.borderindices.length, gl.UNSIGNED_SHORT, 0);

        uniform.color = [0, 1, 1, 1];
        this.program.setUniform(gl, "color", [0, 1, 1, 1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.otherPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.goalleftIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.goalleftIndices.length, gl.UNSIGNED_SHORT, 0);
        gl.drawArrays(gl.LINE_LOOP, 0, 6);
    }
}