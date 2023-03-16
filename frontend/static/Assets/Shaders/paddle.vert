attribute vec2 vertPos;
// attribute vec2 vertCoord;

uniform highp float scale;
uniform vec2 u_translation;
uniform vec2 size;
varying highp vec2 coord;
uniform mat3 u_matrix;

void main() {
	highp vec2 pos = (u_matrix * vec3(vertPos, 1)).xy;
	gl_Position = vec4(pos, 0, 1.0);
	coord = pos;
}