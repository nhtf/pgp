export const gridVert = `
attribute vec2 vertPos;
attribute vec2 vertCoord;

varying highp vec2 coord;

void main() {
	gl_Position = vec4(vertPos, 0, 1.0);
	coord = vertCoord;
}`;