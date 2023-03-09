attribute vec4 vertPos;
attribute vec2 vertCoord;

uniform highp float rotation; //not needed for the ball
uniform highp vec2 position; //position of the ball
varying highp vec2 coord;


void main() {
	gl_Position = vec4((vertPos.xy), 0, 1);
	coord = vertCoord;
}
