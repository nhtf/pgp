
uniform sampler2D tex;
uniform highp vec2 size; //Size of the canvas/image
varying highp vec2 coord;
uniform highp float time; // time in seconds
uniform highp vec2 center; // origin position ripple
uniform highp vec3 shockParams; // 10.0, 0.8, 0.1


highp float plot(highp vec2 st, highp float pct) {
    return  smoothstep( pct - 0.02, pct, st.y) -
            smoothstep( pct, pct + 0.02, st.y);
}

void main()
{
    highp vec2 st = gl_FragCoord.xy / size;

    // Smooth interpolation between 0.1 and 0.9
    highp float y = smoothstep(0.2,1.,st.x);

    highp vec4 color = vec4(vec3(0.), 0.);

    highp float pct = plot(st,y);
    color = (1.0-pct) * color + pct * vec4(0.871, .898, 0.0745, 0.95);
    gl_FragColor = vec4(0.871, .898, 0.0745, 1.);
}