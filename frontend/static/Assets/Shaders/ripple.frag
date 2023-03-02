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
uniform float time; // time in seconds

void main()
{
  highp vec2 tc = coord.xy;
  highp vec2 p = -1.0 + 2.0 * tc;
  highp float len = length(p);
  highp vec2 uv = tc + (p/len)*cos(len*12.0-time*4.0)*0.03;
  highp vec3 col = texture2D(tex,uv).xyz;
  gl_FragColor = vec4(col,1.0);  
}