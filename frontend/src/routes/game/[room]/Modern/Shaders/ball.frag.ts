export const ballFrag: string = `
varying highp vec2 coord;
uniform highp vec2 center; //position ball
uniform highp vec2 size; //Size of the canvas/image
uniform highp vec4 color;

// #define borderThickness .06125
// #define radius 0.125

//TODO make the trailing effect
void main()
{
    highp float radius = size.x / 2.;
    highp float borderThickness = radius / 3.;
    highp vec2 uv = gl_FragCoord.xy - center;
    highp float d = sqrt(dot(uv,uv));
    highp float r1 = 1.0 - smoothstep(radius - borderThickness, radius, d);
    highp float r2 = 1.0 - smoothstep(radius, radius + borderThickness, d);
    highp vec3 ballStrokeColor = vec3(0.745, 0.635, 0.1098);
    highp vec3 ballFillColor = color.xyz;
    highp vec4 col = vec4(mix(ballFillColor, ballStrokeColor, r1), r2);
    gl_FragColor = vec4(col);
}`;

