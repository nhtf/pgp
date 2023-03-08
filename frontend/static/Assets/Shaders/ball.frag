uniform sampler2D tex;
varying highp vec2 coord;
uniform highp vec2 center; //position of the ball
uniform highp float scale;

void main()
{
    highp vec2 r = abs(coord.xy * 2.0 - center);
    highp float s = max(r.x, r.y);
    highp vec3 ballColor = vec3(0.87, 0.898, 0.07);
    highp vec3 bound = vec3(smoothstep(.3, .4, s) * smoothstep(.6, .5, s));
    highp vec3 col = mix(ballColor, bound, 0.3);
    gl_FragColor = vec4(col, 1.);
}