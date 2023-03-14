import { mat3Identity } from "./Matrix";
import type { VectorObject } from "../../lib2D/Math2D";

export type uniforms = {
    pos: VectorObject; //position for ripple effect maybe
    width: number;
    height: number;
    timer: number;
    color?: number[]; 
    resolution: VectorObject;
};
  

export class Program {

    public program: WebGLProgram;
    private timeLocation: WebGLUniformLocation;
    // private uniformScale: WebGLUniformLocation;
    private originPos: WebGLUniformLocation;
    private shockParams: WebGLUniformLocation;
    private uniformTex: WebGLUniformLocation;
    private uniformSize: WebGLUniformLocation;
    private uniformResolution: WebGLUniformLocation;
    private uniformColor: WebGLUniformLocation;
    private uniformTransform: WebGLUniformLocation;
    private uniformGradient: WebGLUniformLocation;
    private uniformGradientPos: WebGLUniformLocation;
    private uniformGradientRadius: WebGLUniformLocation;

    public constructor(gl: WebGL2RenderingContext, vert: string, frag: string) {
        this.program = this.createProgram(gl, vert, frag);
        this.timeLocation = gl.getUniformLocation(this.program, "time")!;
        this.uniformTex = gl.getUniformLocation(this.program, "tex")!;
        this.uniformSize = gl.getUniformLocation(this.program, "size")!;
        this.uniformResolution = gl.getUniformLocation(this.program, "resolution")!;
        this.uniformTransform = gl.getUniformLocation(this.program, "u_matrix")!;
        this.originPos = gl.getUniformLocation(this.program, "center")!;
        this.shockParams = gl.getUniformLocation(this.program, "shockParams")!;
        this.uniformColor = gl.getUniformLocation(this.program, "color")!;
        this.uniformGradient = gl.getUniformLocation(this.program, "gradient")!;
        this.uniformGradientPos = gl.getUniformLocation(this.program, "gradientPos")!;
        this.uniformGradientRadius = gl.getUniformLocation(this.program, "gradientRadius")!;
    }

    public useProgram(gl: WebGL2RenderingContext, uniform: uniforms) {
        gl.useProgram(this.program);
        gl.uniform3f(this.shockParams, 10.0, 0.9, 0.1);
        gl.uniform1f(this.timeLocation, uniform.timer * 0.0025);
        gl.uniform1i(this.uniformTex, 0);
        gl.uniform2f(this.uniformSize, uniform.width, uniform.height);
        gl.uniform2f(this.uniformResolution, uniform.resolution.x, uniform.resolution.y);
        gl.uniform2f(this.originPos, uniform.pos.x, uniform.pos.y);
        if (uniform.color)
            gl.uniform4f(this.uniformColor, uniform.color[0], uniform.color[1], uniform.color[2], uniform.color[3]);
        gl.uniformMatrix3fv(this.uniformTransform, false, mat3Identity);
        gl.uniform1i(this.uniformGradient, 0);
        gl.uniform2f(this.uniformGradientPos, 0, 0);
        gl.uniform2f(this.uniformGradientRadius, 0, 0);
    }

    //For setting individual values
    public setUniform(gl: WebGL2RenderingContext, name: string, value: any) {
        switch (name) {
            case "color":
                gl.uniform4f(this.uniformColor, value[0], value[1], value[2], value[3]);
                break;
            case "transform":
                gl.uniformMatrix3fv(this.uniformTransform, false, value);
            case "gradient":
                gl.uniform1i(this.uniformGradient, value);
            case "gradientPos":
                gl.uniform2f(this.uniformGradientPos, value[0], value[1]);
            case "gradientRadius": 
                gl.uniform2f(this.uniformGradientRadius, value[0], value[1]);
            default:
                break;
        }
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