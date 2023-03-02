#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif


uniform sampler2D tex;
uniform highp vec2 size;
uniform highp float scale;

varying highp vec2 coord;

uniform highp vec2 resolution; // Screen resolution

void main()
{
  highp vec3 col = texture2D(tex,coord.xy).xyz;
  gl_FragColor = vec4(col,1.0);  
}