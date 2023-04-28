import { Program } from "./Program";
import type { Vector } from "../lib2D/Math2D";
import type { simpleVector } from "./Constants";
import type {uniforms} from "./Program";

export type triangles = {
    vertices: number[];
    indices: number[];
}

type Options = {
    transform?: number[];
    gradient?: boolean;
    color?: number[][]; //For example paddle has one mesh but multiple colors
    gradientPos?: simpleVector[];
    gradientRadius?: simpleVector;
    ballRadius?: number;
    size?: simpleVector;
}

type Mesh = {
    vertexBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    indexLength: number;
    options?: Options;
}

export type viewPort = {
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;
};

export class Shader {
    private program: Program;
    private mesh: Map<string, Mesh>;

    constructor(gl: WebGL2RenderingContext, vert_src: string, frag_src: string) {
        this.program = new Program(gl, vert_src, frag_src);
        this.mesh = new Map();
    }

    public addMesh(gl: WebGL2RenderingContext, triangles: triangles, name: string, options?: Options) {
        const vertexBuffer: WebGLBuffer = this.createVertexBuffer(gl, triangles.vertices);
        const indexBuffer: WebGLBuffer = this.createIndexBuffer(gl, triangles.indices);
        const mesh: Mesh = { vertexBuffer: vertexBuffer, indexBuffer: indexBuffer, indexLength: triangles.indices.length, options: options};
        this.mesh.set(name, mesh);
    }

    private createVertexBuffer(gl: WebGLRenderingContext, data: number[]): WebGLBuffer {
        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        return buffer;
    }

    private createIndexBuffer(gl: WebGL2RenderingContext, data: number[]) {
        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
        return buffer;
    }

    private extendOptions(mesh: Mesh, options?: Options) {
        let extendOptions: Options = {};
        extendOptions.transform = options?.transform;
        extendOptions.gradient = mesh.options?.gradient;
        extendOptions.color = mesh.options?.color ? mesh.options?.color : options?.color;
        extendOptions.gradientPos = mesh.options?.gradientPos;
        extendOptions.gradientRadius = options?.gradientRadius ;
        extendOptions.ballRadius = options?.ballRadius;
        extendOptions.size = options?.size;
        return extendOptions;
    }

    private renderMesh(gl: WebGL2RenderingContext, mesh: Mesh, options?: Options, index: number = 0) {
        if (options?.color) {
            this.program.setUniform(gl, "color", options.color[index]);
        }
        if (options?.gradient !== undefined)
            this.program.setUniform(gl, "gradient", options.gradient);
        if (options?.transform)
            this.program.setUniform(gl, "transform", options.transform);
        if (options?.gradientPos)
            this.program.setUniform(gl, "gradientPos", options.gradientPos[index]);
        if (options?.gradientRadius)
            this.program.setUniform(gl, "gradientRadius", options.gradientRadius);
        if (options?.ballRadius)
            this.program.setUniform(gl, "ballRadius", options.ballRadius);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.indexLength, gl.UNSIGNED_SHORT, 0);
    }

    public renderNamed(gl: WebGL2RenderingContext, name: string, options?: Options, index: number = 0) {
        const mesh = this.mesh.get(name)!;
        this.renderMesh(gl, mesh, this.extendOptions(mesh, options), index);
    }

    public setUniform(gl: WebGL2RenderingContext, time: number, viewPort: viewPort, pos: Vector, resolution: simpleVector, options?: Options) {
        const uniform: uniforms = {pos: pos, width: viewPort.width, height: viewPort.height, timer: time, resolution: resolution};
        if (options?.size) {
            uniform.height = options.size.y;
            uniform.width = options.size.x;
        }
        this.program.useProgram(gl, uniform);
        if (options?.gradientRadius) {
            this.program.setUniform(gl, "gradientRadius", options.gradientRadius);
        }
        if (options?.ballRadius)
            this.program.setUniform(gl, "ballRadius", options.ballRadius);
    }

    public renderAll(gl: WebGL2RenderingContext, options?: Options, index: number = 0) {
        this.mesh.forEach((mesh) => this.renderMesh(gl, mesh, this.extendOptions(mesh, options), index));
    }

    //For debugRendering
    public renderPoints(gl: WebGL2RenderingContext, vertices: number[], transform: number[], color: number[]) {
        const buffer = this.createVertexBuffer(gl, vertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);
        this.program.setUniform(gl, "transform", transform);
        this.program.setUniform(gl, "color", color);
        gl.drawArrays(gl.LINES, 0, vertices.length / 2);
        gl.deleteBuffer(buffer);
    }

    public renderTriangles(gl: WebGL2RenderingContext, vertices: number[], transform: number[], color: number[]) {
        const buffer = this.createVertexBuffer(gl, vertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);
        this.program.setUniform(gl, "transform", transform);
        this.program.setUniform(gl, "color", color);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
        gl.deleteBuffer(buffer);
    }
}
