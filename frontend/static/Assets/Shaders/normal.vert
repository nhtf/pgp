attribute vec4 vertPos;
attribute vec2 vertCoord;
attribute vec2 a_position;

uniform highp float scale;
uniform vec2 u_translation;
uniform vec2 size;
varying highp vec2 coord;
uniform mat4 u_matrix;

void main() {
	gl_Position = vec4(vertPos.xy * scale, 0, 1);
	coord = vertCoord;
}