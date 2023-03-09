
uniform sampler2D tex;
uniform highp vec2 size; //Size of the canvas/image
varying highp vec2 coord;
uniform highp float time; // time in seconds
uniform highp vec2 center; // origin position ripple
uniform highp vec3 shockParams; // 10.0, 0.8, 0.1




void main()
{
    gl_FragColor = vec4(0.871, .898, 0.0745, 0.9);
}