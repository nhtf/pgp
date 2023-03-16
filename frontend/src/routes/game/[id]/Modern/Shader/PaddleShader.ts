import type { VectorObject } from "../../lib2D/Math2D";
import { HEIGHT, paddleHeight, paddleWidth, WIDTH } from "../Constants";
import { Program } from "./Program";
import type {uniforms} from "./Program";
import { createBuffer } from "./fullShader";
import { parse } from "$lib/svgMesh/parseSvgPath";
import { contours } from "$lib/svgMesh/svgPathContours";
import { triangulate } from "$lib/svgMesh/triangulateContours";
import { m3 } from "./Matrix";

let VERT_PADDLE_SRC: string;
let FRAG_PADDLE_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"paddle.vert").then(r => r.text().then(d => VERT_PADDLE_SRC = d));
await fetch(path+"paddle.frag").then(r => r.text().then(d => FRAG_PADDLE_SRC = d));

type triangles = {
    positions: number[][];
    cells: number[][];
}

export class PaddleShader {
    private program: Program;
    private scale: number;
    private pos: VectorObject[] = [];
    private rotation: number[] = [];
    private paddleBorderPos: WebGLBuffer;
    private paddleGradientPos: WebGLBuffer;
    private paddleBorderIndices: number[] = [];
    private paddleGradientIndices: number[] = [];
    private level: any;

    constructor(gl: WebGL2RenderingContext, scale: number, level: any) {
        this.level = level;
        this.program = new Program(gl, VERT_PADDLE_SRC, FRAG_PADDLE_SRC);
        this.scale = scale;
        for (let i = 0; i < level.players; i++) {
            this.pos.push(level.paddleStartPos[i]);
            this.rotation.push(level.paddleRot[i].z);
        }
        this.paddleBorderPos = createBuffer(gl, this.bufferPosData(this.getTriangles(level.paddleBorderPath), this.paddleBorderIndices));
        this.paddleGradientPos = (createBuffer(gl, this.bufferPosData(this.getTriangles(level.paddleGradientPath), this.paddleGradientIndices)));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    }

    private bufferPosData(triangles: triangles, indices: number[]): number[] {
        let vertices: number[] = [];
        for (let i = 0; i < triangles.positions.length; i++) {
            let x = triangles.positions[i][0] ;
            let y = triangles.positions[i][1];
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

    private getTriangles(path: string) {
        let svg = parse(path);
        let contour = contours(svg, 1);
        return triangulate(contour);
    }

    public updateScale(scale: number) {
        this.scale = scale;
    }

    public movePaddle(newPos: VectorObject, player: number) {
        this.pos[player].x = newPos.x;
        this.pos[player].y = newPos.y;
    }

    public rotatePaddle(rotation: number, player: number) {
        this.rotation[player] = rotation;
    }

    //TODO fix radialGradient for paddle
    private renderPaddleGradient(gl: WebGL2RenderingContext, paddle: number) {
            this.program.setUniform(gl, "gradient", 1);
            this.program.setUniform(gl, "color", this.level.paddleGradientColors[paddle]);
            const gradientPos = {x: (this.pos[paddle].x), y: (this.pos[paddle].y)}
            this.program.setUniform(gl, "gradientPos", gradientPos);
            this.program.setUniform(gl, "gradientRadius", [20, 20]);
            this.program.setUniform(gl, "rotation", this.rotation[paddle]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.paddleGradientPos);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.paddleGradientIndices), gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, this.paddleGradientIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    private renderPaddleBorder(gl: WebGL2RenderingContext, paddle: number) {
        this.program.setUniform(gl, "color", this.level.paddleBorderColors[paddle]);
        this.program.setUniform(gl, "gradient", 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.paddleBorderPos);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.paddleBorderIndices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, this.paddleBorderIndices.length, gl.UNSIGNED_SHORT, 0);
    }

    public render(gl: WebGL2RenderingContext, time: number, width: number, height: number) {
        const xOffset = Math.floor((width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((height - HEIGHT * this.scale) / 2);
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);

        for (let i = 0; i < this.level.players; i++) {
            const uniform: uniforms = {pos: this.pos[i], width: paddleWidth * this.scale * 2, height: paddleHeight * this.scale, timer: time, resolution: {x: width, y: height}};
            this.program.useProgram(gl, uniform);
            const mat = new m3();
            mat.translation(-WIDTH / 2, -HEIGHT / 2);
            mat.rotationZAxis(this.rotation[i]);
            mat.scaling(2 / WIDTH, 2 / HEIGHT);
            mat.translation(this.pos[i].x, this.pos[i].y);
            this.program.setUniform(gl, "transform", mat.matrix);
            this.renderPaddleGradient(gl, i);
            this.renderPaddleBorder(gl,i);
        }
    }
}