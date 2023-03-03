#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif


uniform sampler2D tex;
uniform highp vec2 size;
uniform highp float scale;

varying highp vec2 coord;
uniform highp float time; // time in seconds
uniform highp vec2 position; // origin position ripple
uniform vec3 shockParams; // 10.0, 0.8, 0.1

void main()
{
  // highp vec3 col = texture2D(tex,coord.xy).xyz;
  // gl_FragColor = vec4(col,1.0);  
  gl_FragColor = texture2D(tex, coord);
}