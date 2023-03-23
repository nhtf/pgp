export const ballVert = `
attribute vec4 vertPos;
attribute vec2 vertCoord;
varying highp vec2 coord;


void main() {
	gl_Position = vec4((vertPos.xy), 0, 1);
	coord = vertCoord;
}`;
