import { Program, type uniforms } from "./Program";
import { createBuffer } from "./fullShader";
import type { m3 } from "../lib2D/Matrix";
import type { VectorObject } from "../lib2D/Math2D";

export type triangles = {
    vertices: number[];
    indices: number[];
}

type Options = {
    transform?: m3;
    gradient?: boolean;
    color?: number[][]; //For example paddle has one mesh but multiple colors
    gradientPos?: VectorObject[];
    gradientRadius?: VectorObject;
    ballRadius?: number;
    size?: VectorObject;
}

type Mesh = {
    buffer: WebGLBuffer;
    indices: number[];
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
        const indices: number[] = triangles.indices;
        const buffer: WebGLBuffer = createBuffer(gl, triangles.vertices);
        const mesh: Mesh = { buffer: buffer, indices: indices, options: options};
        this.mesh.set(name, mesh);
    }

    private extendOptions(mesh: Mesh, options?: Options) {
        let extendOptions: Options = {};
        extendOptions.transform = options?.transform;
        extendOptions.gradient = mesh.options?.gradient;
        extendOptions.color = mesh.options?.color;
        extendOptions.gradientPos = mesh.options?.gradientPos;
        extendOptions.gradientRadius = options?.gradientRadius ;
        extendOptions.ballRadius = options?.ballRadius;
        extendOptions.size = options?.size;
        return extendOptions;
    }

    private renderMesh(gl: WebGL2RenderingContext, mesh: Mesh, options?: Options, index: number = 0) {
        if (options?.color)
            this.program.setUniform(gl, "color", options.color[index]);
        if (options?.gradient)
            this.program.setUniform(gl, "gradient", 1);
        if (options?.transform)
            this.program.setUniform(gl, "transform", options.transform.matrix);
        if (options?.gradientPos)
            this.program.setUniform(gl, "gradientPos", options.gradientPos[index]);
        if (options?.gradientRadius)
            this.program.setUniform(gl, "gradientRadius", options.gradientRadius);
        if (options?.transform)
            this.program.setUniform(gl, "transform", options.transform.matrix);
        if (options?.ballRadius)
            this.program.setUniform(gl, "ballRadius", options.ballRadius);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    public renderNamed(gl: WebGL2RenderingContext, time: number, viewPort: viewPort, pos: VectorObject, resolution: VectorObject, name: string, options?: Options, index: number = 0) {
        const uniform: uniforms = {pos: pos, width: viewPort.width, height: viewPort.height, timer: time, resolution: resolution};
        gl.viewport(viewPort.xOffset, viewPort.yOffset, viewPort.width, viewPort.height);
        this.program.useProgram(gl, uniform);
        const mesh = this.mesh.get(name)!;
        this.renderMesh(gl, mesh, this.extendOptions(mesh, options), index);
    }

    public renderAll(gl: WebGL2RenderingContext, time: number, viewPort: viewPort, pos: VectorObject, resolution: VectorObject, options?: Options, index: number = 0,) {
        const uniform: uniforms = {pos: pos, width: viewPort.width, height: viewPort.height, timer: time, resolution: resolution};
        if (options?.size) {
            uniform.height = options.size.y;
            uniform.width = options.size.x;
        }
        gl.viewport(viewPort.xOffset, viewPort.yOffset, viewPort.width, viewPort.height);
        this.program.useProgram(gl, uniform);
        this.mesh.forEach((mesh) => this.renderMesh(gl, mesh, this.extendOptions(mesh, options), index));
    }

    //For debugRendering
    public renderPoints(gl: WebGL2RenderingContext, vertices: number[], time: number, viewPort: viewPort, pos: VectorObject, resolution: VectorObject, transform: m3, color: number[]) {
        const uniform: uniforms = {pos: pos, width: viewPort.width, height: viewPort.height, timer: time, resolution: resolution};
        const buffer = createBuffer(gl, vertices);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(0);
		this.program.useProgram(gl, uniform);
        this.program.setUniform(gl, "transform", transform.matrix);
        this.program.setUniform(gl, "color", color);
        gl.drawArrays(gl.LINES, 0, vertices.length / 2);
    }
}
