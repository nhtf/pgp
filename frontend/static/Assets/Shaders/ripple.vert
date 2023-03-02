attribute vec4 vertPos;
attribute vec2 vertCoord;

varying highp vec2 coord;

void main() {
	gl_Position = vertPos;
	coord = vertCoord;
}