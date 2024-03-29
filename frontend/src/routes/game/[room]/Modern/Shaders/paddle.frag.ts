export const paddleFrag = `

uniform highp vec2 size; //Size of the field/image
uniform highp vec2 resolution; //Size of the /image
varying highp vec2 coord;
uniform highp float time; // time in seconds
uniform highp vec2 center; // origin position ripple
uniform highp vec3 shockParams; // 10.0, 0.8, 0.1
uniform highp vec4 color;
uniform bool gradient; // if need to do a gradient or not
uniform highp vec2 gradientPos;
uniform highp vec2 gradientRadius;
uniform highp float rotation; // time 

// highp vec4 getGradientColor(){
//     highp vec2 uv = (gl_FragCoord.xy / resolution.xy);
//     uv.y = (uv.y - 1. ) * -1.;

//     highp float max_radius = max(gradientRadius.x, gradientRadius.y);
//     highp float sx = gradientRadius.x / max_radius;
//     highp float sy = gradientRadius.y / max_radius;

//     highp float rot_c = cos(rotation);
//     highp float rot_s = sin(rotation);

//     highp vec2 abs_center_point = vec2(0.1, 0.0) * size;
//     highp vec2 st = (uv * size) - abs_center_point;
//     st = vec2(st.x, st.y);
//     st /= vec2(sx, sy);
//     st += abs_center_point;

//     //For gradient
//     highp vec4 stopColor = vec4(0.);
//     highp float abs_d = distance(abs_center_point, st);
//     highp float progress = abs_d / max_radius; // this is based off the max radius
//     highp vec4 retcolor = mix(stopColor, color, smoothstep(1.0, 0.0, progress));
//     return retcolor;
// }

void main()
{
    // if (!gradient)
        gl_FragColor = color;
    // else
        // gl_FragColor = getGradientColor();
}`;
