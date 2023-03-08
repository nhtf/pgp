import type { VectorObject } from "../../lib2D/Math2D";

export type uniforms = {
    pos: VectorObject;
    width: number;
    height: number;
    timer: number;
    scale: number;
};

export class Program {

    public program: WebGLProgram;
    private timeLocation: WebGLUniformLocation;
    private uniformScale: WebGLUniformLocation;
    private originPos: WebGLUniformLocation;
    private shockParams: WebGLUniformLocation;
    private uniformTex: WebGLUniformLocation;
    private uniformSize: WebGLUniformLocation;

    public constructor(gl: WebGL2RenderingContext, vert: string, frag: string) {
        this.program = this.createProgram(gl, vert, frag);
        this.timeLocation = gl.getUniformLocation(this.program, "time")!;
        this.uniformTex = gl.getUniformLocation(this.program, "tex")!;
        this.uniformSize = gl.getUniformLocation(this.program, "size")!;
        this.uniformScale = gl.getUniformLocation(this.program, "scale")!;
        this.originPos = gl.getUniformLocation(this.program, "center")!;
        this.shockParams = gl.getUniformLocation(this.program, "shockParams")!;
    }

    public useProgram(gl: WebGL2RenderingContext, uniform: uniforms) {
        gl.useProgram(this.program);
        gl.uniform3f(this.shockParams, 10.0, 0.9, 0.1);
        gl.uniform1f(this.timeLocation, uniform.timer * 0.0025);
        gl.uniform1i(this.uniformTex, 0);
        gl.uniform2f(this.uniformSize, uniform.width, uniform.height);
        gl.uniform2f(this.originPos, uniform.pos.x, uniform.pos.y);
        gl.uniform1f(this.uniformScale, uniform.scale);
    }

    private createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
    
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
        }
    
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }

    private createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
    
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
        }
    
        return shader;
    }
}