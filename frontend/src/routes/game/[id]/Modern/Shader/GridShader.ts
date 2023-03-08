import type { VectorObject } from "../../lib2D/Math2D";
import { HEIGHT, WIDTH } from "../Constants";
import { createBuffer } from "./fullShader";
import { Program, type uniforms } from "./Program";

let VERT_GRID_SRC: string;
let FRAG_GRID_SRC: string;

const path = "/Assets/Shaders/";
await fetch(path+"grid.vert").then(r => r.text().then(d => VERT_GRID_SRC = d));
await fetch(path+"grid.frag").then(r => r.text().then(d => FRAG_GRID_SRC = d));

const UniqueVertices = 4;
const hexSize = 2;
const a = 2 * Math.PI / 6;

function singleHexagonVertices(x: number, y: number, scale: number): number[] {
    var x = x / (WIDTH * scale); //x coordinate for the center of the hexagon
	var y = y / (HEIGHT * scale); //y coordinate for the center of the hexagon
	var r = .25; //radius of the circle upon which the vertices of the hexagon lie.
	var q = Math.sqrt(Math.pow(r,2) - Math.pow((r/2),2)); //y coordinate of the points that are above and below center point
	var xCoord = new Array(8);
	var yCoord = new Array(8);
	xCoord[0] = x;
	yCoord[0] = y;
	xCoord[1] = x + r;
	yCoord[1] = y;
	xCoord[2] = x + (r/2);
	yCoord[2] = y+q;
	xCoord[3] = x-(r/2);
	yCoord[3] = y+q;
	xCoord[4] = x - r;
	yCoord[4] = y;
	xCoord[5] = x-(r/2);
	yCoord[5] = y-q;
	xCoord[6] = x + (r/2);
	yCoord[6] = y-q;
	xCoord[7] = x + r;
	yCoord[7] = y;
    
    let vertices: number[]  = [xCoord[0], yCoord[0]];
    for ( let i = 1; i < xCoord.length; i++) {
        vertices.push(xCoord[i]);
        vertices.push(yCoord[i]);
        // console.log("Coordinate " + i + ": " + xCoord[i] + "," + yCoord[i]);
    }
    return vertices;
}



function getGridVertices(scale: number) : number[] {
    let vertices: number[] = [];
    for (let y = -hexSize * scale; y < (HEIGHT + hexSize) * scale; y += hexSize * Math.sin(a) * scale) {
        for (let x = -hexSize * scale, 
            j = 0; 
            x < (WIDTH + hexSize) * scale; 
            x += hexSize * (1 + Math.cos(a)) * scale, 
            y += (-1) ** j++ * hexSize * scale * Math.sin(a)) {
            vertices.push(...singleHexagonVertices(x, y, scale));
        }
    }
    // console.log("vertices: ", singleHexagonVertices(120, 120, 1));
    return singleHexagonVertices(0, 0, 1);
    // return vertices;
    //TODO remove uniques
}

export class GridShader {
    private bufferPos: WebGLBuffer;
    private bufferCoord: WebGLBuffer;
    private program: Program;
    private scale: number;
    private pos: VectorObject;
    private vertices: number;

    constructor(gl: WebGL2RenderingContext, scale: number) {
        this.program = new Program(gl, VERT_GRID_SRC, FRAG_GRID_SRC);
        this.scale = scale;
        this.vertices = 4;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
        this.bufferCoord = createBuffer(gl, [1, 1, 0, 1, 1, 0, 0, 0]);
        this.pos = {x: 0, y: 0};
    }

    //Vertex positions for grid quad
    private bufferPosData(): number[] {
		// const x = WIDTH * this.scale;
		// const y = HEIGHT * this.scale;
        const x = 1;
        const y = 1;
        this.vertices = 4;
        // return buffer;
        // console.log("xy: ", x, y);
		return [-x, -y, x, -y, -x, y, x, y];
	}

    public updateBuffer(gl: WebGL2RenderingContext, scale: number) {
        this.scale = scale;
        this.bufferPos = createBuffer(gl, this.bufferPosData());
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.bufferPosData()), gl.STATIC_DRAW);
    }

    public moveBall(newPos: VectorObject) {
        this.pos.x = newPos.x;
        this.pos.y = newPos.y;
    }

    public render(gl: WebGL2RenderingContext, uniform: uniforms) {
        const xOffset = Math.floor((uniform.width - WIDTH * this.scale) / 2);
		const yOffset = Math.floor((uniform.height - HEIGHT * this.scale) / 2);
        uniform.width = WIDTH * this.scale;
        uniform.height = HEIGHT * this.scale;
        uniform.pos.x = xOffset / (WIDTH * this.scale * 2) - 1;
        uniform.pos.y = yOffset / (HEIGHT * this.scale * 2) - 1;
        gl.viewport(xOffset, yOffset, WIDTH * this.scale, HEIGHT * this.scale);
        this.program.useProgram(gl, uniform);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferPos);
        var pos = gl.getAttribLocation(this.program.program, "vertPos");
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferCoord);
        var coord = gl.getAttribLocation(this.program.program, "vertCoord");
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coord);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices);
    }
}