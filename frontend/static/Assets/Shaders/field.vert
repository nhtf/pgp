attribute vec2 vertPos;
// attribute vec2 vertCoord;

uniform highp float scale;
uniform vec2 u_translation;
uniform vec2 size;
varying highp vec2 coord;
uniform mat4 u_matrix;

void main() {
	gl_Position = vec4(vertPos, 0, 1.0);
	coord = vertPos;
}