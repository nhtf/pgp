import { FIELDHEIGHT, FIELDWIDTH, HEIGHT, WIDTH } from "../Constants";
import { Program, type uniforms } from "./Program";
import { createBuffer } from "./fullShader";
import { parse } from "$lib/svgMesh/parseSvgPath";
import { contours } from "$lib/svgMesh/svgPathContours";
import { triangulate } from "$lib/svgMesh/triangulateContours";
import { m3 } from "./Matrix";
// import svgMesh3d from "svg-mesh-3d";


let VERT_FIELD_SRC: string;
let FRAG_FIELD_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"field.vert").then(r => r.text().then(d => VERT_FIELD_SRC = d));
await fetch(path+"field.frag").then(r => r.text().then(d => FRAG_FIELD_SRC = d));

const fieldBorderPath = "M 63.282 38.282 C 61.536 40.029 60.478 42.341 60.5 45 L 60.5 205 C 60.478 207.659 61.536 209.971 63.282 211.718 C 65.029 213.464 67.341 214.522 70 214.5 L 370 214.5 C 372.659 214.522 374.971 213.464 376.718 211.718 C 378.464 209.971 379.522 207.659 379.5 205 L 379.5 45 C 379.522 42.341 378.464 40.029 376.718 38.282 C 374.971 36.536 372.659 35.478 370 35.5 L 70 35.5 C 67.341 35.478 65.029 36.536 63.282 38.282 Z M 70 34.5 L 370 34.5 C 372.864 34.522 375.552 35.703 377.425 37.575 C 379.297 39.448 380.478 42.136 380.5 45 L 380.5 205 C 380.478 207.864 379.297 210.552 377.425 212.425 C 375.552 214.297 372.864 215.478 370 215.5 L 70 215.5 C 67.136 215.478 64.448 214.297 62.575 212.425 C 60.703 210.552 59.522 207.864 59.5 205 L 59.5 45 C 59.522 42.136 60.703 39.448 62.575 37.575 C 64.448 35.703 67.136 34.522 70 34.5 Z M 63.282 38.282 C 61.536 40.029 60.478 42.341 60.5 45 L 60.5 205 C 60.478 207.659 61.536 209.971 63.282 211.718 C 65.029 213.464 67.341 214.522 70 214.5 L 370 214.5 C 372.659 214.522 374.971 213.464 376.718 211.718 C 378.464 209.971 379.522 207.659 379.5 205 L 379.5 45 C 379.522 42.341 378.464 40.029 376.718 38.282 C 374.971 36.536 372.659 35.478 370 35.5 L 70 35.5 C 67.341 35.478 65.029 36.536 63.282 38.282 Z M 70.5 37 L 369.5 37 C 371.811 37.022 374 37.979 375.51 39.49 C 377.021 41 377.978 43.189 378 45.5 L 378 204.5 C 377.978 206.811 377.021 209 375.51 210.51 C 374 212.021 371.811 212.978 369.5 213 L 70.5 213 C 68.189 212.978 66 212.021 64.49 210.51 C 62.979 209 62.022 206.811 62 204.5 L 62 45.5 C 62.022 43.189 62.979 41 64.49 39.49 C 66 37.979 68.189 37.022 70.5 37 ZM 70.5 37 L 369.5 37 C 371.811 37.022 374 37.979 375.51 39.49 C 377.021 41 377.978 43.189 378 45.5 L 378 204.5 C 377.978 206.811 377.021 209 375.51 210.51 C 374 212.021 371.811 212.978 369.5 213 L 70.5 213 C 68.189 212.978 66 212.021 64.49 210.51 C 62.979 209 62.022 206.811 62 204.5 L 62 45.5 C 62.022 43.189 62.979 41 64.49 39.49 C 66 37.979 68.189 37.022 70.5 37 Z M 65.197 40.197 C 63.812 41.581 62.978 43.393 63 45.5 L 63 204.5 C 62.978 206.607 63.812 208.419 65.197 209.803 C 66.581 211.188 68.393 212.022 70.5 212 L 369.5 212 C 371.607 212.022 373.419 211.188 374.803 209.803 C 376.188 208.419 377.022 206.607 377 204.5 L 377 45.5 C 377.022 43.393 376.188 41.581 374.803 40.197 C 373.419 38.812 371.607 37.978 369.5 38 L 70.5 38 C 68.393 37.978 66.581 38.812 65.197 40.197 Z";
const goalBorderPath = "M 52.5 93.75 L 59.5 93.75 L 59.5 156.25 L 52.5 156.25 C 49.738 156.25 47.5 154.012 47.5 151.25 L 47.5 98.75 C 47.5 95.989 49.738 93.75 52.5 93.75 ZM 52.5 96 L 59.5 96 L 59.5 154 L 52.5 154 C 50.843 154 49.5 152.657 49.5 151 L 49.5 99 C 49.5 97.343 50.843 96 52.5 96 Z";
const goalGradientPath = "M 52.5 96 L 59.5 96 L 59.5 154 L 52.5 154 C 50.843 154 49.5 152.657 49.5 151 L 49.5 99 C 49.5 97.343 50.843 96 52.5 96 Z";
const fieldGradientPathLeft = "M 70.375 37.75 L 220 37.75 L 220 212.25 L 70.375 212.25 C 66.027 212.25 62.5 208.678 62.5 204.273 L 62.5 45.727 C 62.5 41.322 66.027 37.75 70.375 37.75 Z";


type triangles = {
    positions: number[][];
    cells: number[][];
}

enum goals {
    GOAL1,
    GOAL2,
    GOAL3,
    GOAL4
}

export class FieldShader {
    private program: Program;
    private scale: number;
    private fieldBorderPos: WebGLBuffer;
    private fieldGradientPos: WebGLBuffer[] = [];
    private goalBorderPos: WebGLBuffer[] = [];
    private goalGradientPos: WebGLBuffer[] = [];
    private fieldBorderIndices: number[] = [];
    private fieldGradientIndices: number[][] = [];
    private goalBorderIndices: number[][] = [];
    private goalGradientIndices: number[][] = [];

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_FIELD_SRC, FRAG_FIELD_SRC);
        this.scale = scale;
        this.fieldBorderPos = createBuffer(gl, this.bufferPosData(this.getTriangles(fieldBorderPath), this.fieldBorderIndices));
        this.fieldGradientIndices.push([]);
        this.fieldGradientPos.push(createBuffer(gl, this.bufferPosData(this.getTriangles(fieldGradientPathLeft), this.fieldGradientIndices[0])));

        this.createGoal(gl, goalBorderPath, goalGradientPath, goals.GOAL1);
        this.createGoal(gl, goalBorderPath, goalGradientPath, goals.GOAL2);
        // console.log("triangulate: ", triangulate(this.contour));
    }

    public updateScale(scale: number) {
        this.scale = scale;
    }

    private getTriangles(path: string) {
        let svg = parse(path);
        let contour = contours(svg, 1);
        return triangulate(contour);
    }

    private createGoal(gl: WebGL2RenderingContext, pathBorder: string, pathGradient: string, goal: number) {
        this.goalBorderIndices.push([]);
        this.goalBorderPos.push(createBuffer(gl, this.bufferPosData(this.getTriangles(pathBorder), this.goalBorderIndices[goal])));
        this.goalGradientIndices.push([]);
        this.goalGradientPos.push(createBuffer(gl, this.bufferPosData(this.getTriangles(pathGradient), this.goalGradientIndices[goal])));
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

    private renderFieldGradient(gl: WebGL2RenderingContext, color: number[], transform: m3, pos: number[], dim: number[]) {
        this.program.setUniform(gl, "color", color);
        this.program.setUniform(gl, "transform", transform.matrix);
        this.program.setUniform(gl, "gradient", 1);
        this.program.setUniform(gl, "gradientPos", pos);
        this.program.setUniform(gl, "gradientRadius", [140 * this.scale, 120  * this.scale]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fieldGradientPos[0]);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.fieldGradientIndices[0]), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.fieldGradientIndices[0].length, gl.UNSIGNED_SHORT, 0);
    }

    private renderField(gl: WebGL2RenderingContext, dim: number[]) {
        const mat = new m3();
        this.program.setUniform(gl, "transform", mat.matrix);

        //Gradient
        this.renderFieldGradient(gl, [213/255, 172/255, 28/255, 0.7], mat, [0.5 - (135 / WIDTH), 0.5 ], dim);
        mat.rotation(Math.PI);
        this.renderFieldGradient(gl, [65/255, 190/255, 220/255, 0.7], mat, [0.5 + (135 / WIDTH), 0.5], dim );

        //Border
        const matIdent = new m3();
        this.program.setUniform(gl, "color", [222/255, 229/255, 19/255, 0.9]);
        this.program.setUniform(gl, "transform", matIdent.matrix);
        this.program.setUniform(gl, "gradient", 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fieldBorderPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.fieldBorderIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.fieldBorderIndices.length, gl.UNSIGNED_SHORT, 0);

        //TODO make the middleLine
        //TODO improve the class so it works with other fields too
        //TODO get the triangulate data from a file instead of making this at runtime , just have triangles and other data in a single file for level
    }

    private renderGoal(gl: WebGL2RenderingContext, transform: m3, goal: number, colorBorder: number[], colorFill: number[]) {
        this.program.setUniform(gl, "transform", transform.matrix);
        this.program.setUniform(gl, "color", colorBorder);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.goalBorderPos[goal]);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.goalBorderIndices[goal]), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.goalBorderIndices[goal].length, gl.UNSIGNED_SHORT, 0);
        this.program.setUniform(gl, "color", colorFill);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.goalGradientPos[goal]);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.goalGradientIndices[goal]), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.goalGradientIndices[goal].length, gl.UNSIGNED_SHORT, 0);
    }

    private renderGoals(gl: WebGL2RenderingContext) {
        const mat = new m3();
        this.renderGoal(gl, mat, goals.GOAL1, [0.835, 0.6745, 0.1098, 0.9], [0.835, 0.6745, 0.1098, 0.7]);
        mat.rotation(Math.PI);
        this.renderGoal(gl, mat, goals.GOAL2, [0.2549, 0.745, 0.8627, 0.9], [0.2549, 0.745, 0.8627, 0.7]);
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        let uniform: uniforms = {pos: {x: 0, y:0}, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time, resolution: {x: width, y: height}};
        uniform.color = [222/255, 229/255, 19/255, 0.9];
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        this.program.useProgram(gl, uniform);
        
        this.renderGoals(gl);
        this.renderField(gl, [width, height]);
    }
}