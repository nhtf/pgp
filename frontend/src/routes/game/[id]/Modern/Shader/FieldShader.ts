import { FIELDHEIGHT, FIELDWIDTH, HEIGHT, WIDTH } from "../Constants";
import { Program, type uniforms } from "./Program";
import { createBuffer } from "./fullShader";
import { parse } from "$lib/svgMesh/parseSvgPath";
import { contours } from "$lib/svgMesh/svgPathContours";
import { triangulate } from "$lib/svgMesh/triangulateContours";
import { m3 } from "./Matrix";
import type { VectorObject } from "../../lib2D/Math2D";
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
const middleCircleBorder = "M 233.5 125 C 233.5 128.656 231.934 132.158 229.546 134.546 C 227.158 136.934 223.656 138.5 220 138.5 C 216.344 138.5 212.842 136.934 210.454 134.546 C 208.066 132.158 206.5 128.656 206.5 125 C 206.5 121.344 208.066 117.842 210.454 115.454 C 212.842 113.066 216.344 111.5 220 111.5 C 223.656 111.5 227.158 113.066 229.546 115.454 C 231.934 117.842 233.5 121.344 233.5 125 Z M 228.132 116.868 C 225.996 114.732 223.247 113.5 220 113.5 C 216.753 113.5 214.004 114.732 211.868 116.868 C 209.732 119.004 208.5 121.753 208.5 125 C 208.5 128.247 209.732 130.996 211.868 133.132 C 214.004 135.268 216.753 136.5 220 136.5 C 223.247 136.5 225.996 135.268 228.132 133.132 C 230.268 130.996 231.5 128.247 231.5 125 C 231.5 121.753 230.268 119.004 228.132 116.868 Z";
const middleCircleFill = "M 233 125 C 233 117.82 227.18 112 220 112 C 212.82 112 207 117.82 207 125 C 207 132.18 212.82 138 220 138 C 227.18 138 233 132.18 233 125 Z";
const middleLine = "M 219 111.5 L 219 38 L 221 38 L 221 111.5 L 219 111.5 Z";

const fieldBorder4PPath = "M 65.722 127.548 C 64.93 125.972 64.932 124.02 65.724 122.444 L 116.112 35.179 L 323.887 35.179 L 374.276 122.444 C 375.069 124.022 375.068 125.972 374.275 127.549 L 323.895 214.818 L 116.105 214.819 L 115.672 214.069 Z M 117.837 211.819 L 322.163 211.818 L 371.677 126.049 C 372.27 125.222 372.269 124.77 371.676 123.942 L 322.155 38.179 L 117.844 38.179 L 68.322 123.944 C 67.73 124.774 67.73 125.224 68.322 126.052 Z";

// import {level} from "./2playerLevel";
import {level} from "./4playerLevel";


type triangles = {
    positions: number[][];
    cells: number[][];
}

export class FieldShader {
    private program: Program;
    private scale: number;
    private fieldBorderPos: WebGLBuffer;
    private fieldGradientPos: WebGLBuffer;
    private goalBorderPos: WebGLBuffer;
    private goalGradientPos: WebGLBuffer;
    private fieldBorderIndices: number[] = [];
    private fieldGradientIndices: number[] = [];
    private goalBorderIndices: number[] = [];
    private goalGradientIndices: number[] = [];
    private circleBorderPos: WebGLBuffer;
    private circleBorderIndices: number[] = [];
    private circleFillPos: WebGLBuffer;
    private circleFillIndices: number[] = [];
    private middleLinePos: WebGLBuffer;
    private middleLineIndices: number[] = [];

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_FIELD_SRC, FRAG_FIELD_SRC);
        this.scale = scale;
        this.fieldBorderPos = createBuffer(gl, this.bufferPosData(this.getTriangles(level.fieldBorderPath), this.fieldBorderIndices));
        this.fieldGradientPos = (createBuffer(gl, this.bufferPosData(this.getTriangles(level.fieldGradientPath), this.fieldGradientIndices)));

        this.goalBorderPos = (createBuffer(gl, this.bufferPosData(this.getTriangles(level.goalBorderPath), this.goalBorderIndices)));
        this.goalGradientPos = (createBuffer(gl, this.bufferPosData(this.getTriangles(level.goalGradientPath), this.goalGradientIndices)));

        this.circleBorderPos = createBuffer(gl, this.bufferPosData(this.getTriangles(level.middleCircleBorder), this.circleBorderIndices));
        this.circleFillPos = createBuffer(gl, this.bufferPosData(this.getTriangles(level.middleCircleGradient), this.circleFillIndices));
        this.middleLinePos = createBuffer(gl, this.bufferPosData(this.getTriangles(level.middleLine), this.middleLineIndices));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    }

    public updateScale(scale: number) {
        this.scale = scale;
    }

    private getTriangles(path: string) {
        let svg = parse(path);
        let contour = contours(svg, 1);
        return triangulate(contour);
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

    private renderFieldGradients(gl: WebGL2RenderingContext) {
        const mat = new m3();

        for (let i = 0; i < level.players; i++) {
            if (level.fieldGradientRot[i].z > 0)
                mat.rotation(level.fieldGradientRot[i].z);
            if (level.fieldGradientRot[i].x > 0)
                mat.rotationXAxis(level.fieldGradientRot[i].x);
            if (level.fieldGradientRot[i].y > 0)
                mat.rotationYAxis(level.fieldGradientRot[i].y);
        this.program.setUniform(gl, "gradient", 1);
        this.program.setUniform(gl, "color", level.fieldGradientColors[i]);
        this.program.setUniform(gl, "transform", mat.matrix);
        this.program.setUniform(gl, "gradient", 1);
        this.program.setUniform(gl, "gradientPos", level.fieldGradientPos[i]);
        this.program.setUniform(gl, "gradientRadius", [level.fieldGradientRadius.x * this.scale, level.fieldGradientRadius.y  * this.scale]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fieldGradientPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.fieldGradientIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.fieldGradientIndices.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    private renderFieldBorder(gl: WebGL2RenderingContext) {
        const mat = new m3();
        this.program.setUniform(gl, "color", level.fieldBorderColor);
        this.program.setUniform(gl, "transform", mat.matrix);
        this.program.setUniform(gl, "gradient", 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fieldBorderPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.fieldBorderIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.fieldBorderIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    private renderMiddleLine(gl: WebGL2RenderingContext) {
        const mat = new m3();
        this.program.setUniform(gl, "color", level.middleCircleColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.circleFillPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.circleFillIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.circleFillIndices.length, gl.UNSIGNED_SHORT, 0);

        this.program.setUniform(gl, "color", level.middleLineColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.circleBorderPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.circleBorderIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.circleBorderIndices.length, gl.UNSIGNED_SHORT, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.middleLinePos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.middleLineIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.middleLineIndices.length, gl.UNSIGNED_SHORT, 0);

        mat.rotation(Math.PI);
        this.program.setUniform(gl, "transform", mat.matrix);
        gl.drawElements(gl.TRIANGLES, this.middleLineIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    private renderField(gl: WebGL2RenderingContext) {
        

        //Gradient
        this.renderFieldGradients(gl);

        //Border
        this.renderFieldBorder(gl);
        
        // MiddleLine
        this.renderMiddleLine(gl);
        //TODO get the triangulate data from a file instead of making this at runtime , just have triangles and other data in a single file for level
    }

    private renderGoals(gl: WebGL2RenderingContext) {
        for (let i = 0; i < level.players; i++) {
            const mat = new m3();
            if (level.goalRot[i].z > 0)
                mat.rotation(level.goalRot[i].z);
            if (level.goalRot[i].x > 0)
                mat.rotationXAxis(level.goalRot[i].x);
            if (level.goalRot[i].y > 0)
                mat.rotationYAxis(level.goalRot[i].y);

            // this.program.setUniform(gl, "gradient", 0);
            this.program.setUniform(gl, "transform", mat.matrix);
            this.program.setUniform(gl, "color", level.goalBorderColors[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.goalBorderPos);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.goalBorderIndices), gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, this.goalBorderIndices.length, gl.UNSIGNED_SHORT, 0);

            // this.program.setUniform(gl, "gradient", 0);
            this.program.setUniform(gl, "color", level.goalGradientColors[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.goalGradientPos);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.goalGradientIndices), gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, this.goalGradientIndices.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number, ballPos: VectorObject) {
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        let uniform: uniforms = {pos: {x: (ballPos.x) / width, y: 1 - ballPos.y / height }, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time, resolution: {x: width, y: height}};
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        this.program.useProgram(gl, uniform);
        
        this.renderGoals(gl);
        this.renderField(gl);
    }
}

//TODO have the fieldBorderLines draw after ball
//TODO make the levels json files again with triangles instead of path strings