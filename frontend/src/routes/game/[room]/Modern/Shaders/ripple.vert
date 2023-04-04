attribute vec4 vertPos;
attribute vec2 vertCoord;

uniform highp float scale;
varying highp vec2 coord;

void main() {
	gl_Position = vec4(vertPos.xy * scale, 0, 1);
	coord = vertCoord;
}
