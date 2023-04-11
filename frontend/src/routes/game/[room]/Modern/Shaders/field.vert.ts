export const fieldVert = `
attribute vec2 vertPos;
varying highp vec2 coord;
uniform mat3 u_matrix;
uniform highp vec3 shockParams; // 10.0, 0.8, 0.1
uniform highp float time;
uniform highp vec2 center;

void main() {
	highp vec2 pos = (u_matrix * vec3(vertPos, 1)).xy;

	gl_Position = vec4(pos, 0, 1.);
	coord = pos;
}`;