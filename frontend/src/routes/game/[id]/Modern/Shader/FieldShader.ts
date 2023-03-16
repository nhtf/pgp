import { FIELDHEIGHT, FIELDWIDTH, HEIGHT, WIDTH } from "../Constants";
import { Program, type uniforms } from "./Program";
import { createBuffer } from "./fullShader";
import { parse } from "$lib/svgMesh/parseSvgPath";
import { contours } from "$lib/svgMesh/svgPathContours";
import { triangulate } from "$lib/svgMesh/triangulateContours";
import { m3 } from "./Matrix";
import type { VectorObject } from "../../lib2D/Math2D";


let VERT_FIELD_SRC: string;
let FRAG_FIELD_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"field.vert").then(r => r.text().then(d => VERT_FIELD_SRC = d));
await fetch(path+"field.frag").then(r => r.text().then(d => FRAG_FIELD_SRC = d));

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
    private level: any; //TODO fix the type

    constructor(gl: WebGL2RenderingContext, scale: number, level: any) {
        this.level = level;
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

        for (let i = 0; i < this.level.players; i++) {
            if (this.level.fieldGradientRot[i].z > 0)
                mat.rotationZAxis(this.level.fieldGradientRot[i].z);
            if (this.level.fieldGradientRot[i].x > 0)
                mat.rotationXAxis(this.level.fieldGradientRot[i].x);
            if (this.level.fieldGradientRot[i].y > 0)
                mat.rotationYAxis(this.level.fieldGradientRot[i].y);
        this.program.setUniform(gl, "gradient", 1);
        this.program.setUniform(gl, "color", this.level.fieldGradientColors[i]);
        this.program.setUniform(gl, "transform", mat.matrix);
        this.program.setUniform(gl, "gradient", 1);
        this.program.setUniform(gl, "gradientPos", this.level.fieldGradientPos[i]);
        this.program.setUniform(gl, "gradientRadius", [this.level.fieldGradientRadius.x * this.scale, this.level.fieldGradientRadius.y  * this.scale]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fieldGradientPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.fieldGradientIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.fieldGradientIndices.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    public renderFieldBorder(gl: WebGL2RenderingContext, time: number, width: number, height: number, ballPos: VectorObject) {
        const uniform: uniforms = {pos: {x: (ballPos.x) / width, y: 1 - ballPos.y / height }, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time, resolution: {x: width, y: height}};
        const mat = new m3();
        this.program.useProgram(gl, uniform);
        this.program.setUniform(gl, "color", this.level.fieldBorderColor);
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
        this.program.setUniform(gl, "gradient", 0);
        this.program.setUniform(gl, "color", this.level.middleCircleColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.circleFillPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.circleFillIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.circleFillIndices.length, gl.UNSIGNED_SHORT, 0);

        this.program.setUniform(gl, "color", this.level.middleLineColor);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.circleBorderPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.circleBorderIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.circleBorderIndices.length, gl.UNSIGNED_SHORT, 0);

        this.program.setUniform(gl, "transform", mat.matrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.middleLinePos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.middleLineIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.middleLineIndices.length, gl.UNSIGNED_SHORT, 0);

        mat.rotationZAxis(Math.PI);
        this.program.setUniform(gl, "transform", mat.matrix);
        gl.drawElements(gl.TRIANGLES, this.middleLineIndices.length, gl.UNSIGNED_SHORT, 0);

        if (this.level.players > 2) {
            mat.rotationZAxis(Math.PI / 2);
            mat.translation(-23 / WIDTH, 0);
            mat.scaling(1.08, 1.25);
            this.program.setUniform(gl, "transform", mat.matrix);
            gl.drawElements(gl.TRIANGLES, this.middleLineIndices.length, gl.UNSIGNED_SHORT, 0);
            mat.rotationZAxis(Math.PI);
            this.program.setUniform(gl, "transform", mat.matrix);
            gl.drawElements(gl.TRIANGLES, this.middleLineIndices.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    private renderField(gl: WebGL2RenderingContext) {
        //Gradient
        this.renderFieldGradients(gl);
        
        // MiddleLine
        this.renderMiddleLine(gl);
    }
    //TODO make the levels json files again with triangles instead of path strings
    //TODO gradient radius doesn't scale properly
    private renderGoals(gl: WebGL2RenderingContext) {
        for (let i = 0; i < this.level.players; i++) {
            const mat = new m3();
            if (this.level.goalRot[i].z > 0)
                mat.rotationZAxis(this.level.goalRot[i].z);
            if (this.level.goalRot[i].x > 0)
                mat.rotationXAxis(this.level.goalRot[i].x);
            if (this.level.goalRot[i].y > 0)
                mat.rotationYAxis(this.level.goalRot[i].y);

            // this.program.setUniform(gl, "gradient", 0);
            this.program.setUniform(gl, "transform", mat.matrix);
            this.program.setUniform(gl, "color", this.level.goalBorderColors[i]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.goalBorderPos);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.goalBorderIndices), gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, this.goalBorderIndices.length, gl.UNSIGNED_SHORT, 0);

            // this.program.setUniform(gl, "gradient", 0);
            this.program.setUniform(gl, "color", this.level.goalGradientColors[i]);
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
        const uniform: uniforms = {pos: {x: (ballPos.x) / width, y: 1 - ballPos.y / height }, width: WIDTH * this.scale, height: HEIGHT * this.scale, timer: time, resolution: {x: width, y: height}};
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        this.program.useProgram(gl, uniform);
        
        this.renderGoals(gl);
        this.renderField(gl);
    }
}
