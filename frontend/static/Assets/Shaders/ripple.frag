#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif


uniform sampler2D tex;
uniform highp vec2 size;
uniform highp float scale;
varying highp vec2 coord;
uniform highp vec2 center; // origin position ripple
uniform float time; // time in seconds
uniform vec3 shockParams; // 10.0, 0.8, 0.1

void main()
{
  // highp vec2 tc = coord.xy;
  // highp vec2 p = -1.0 + 2.0 * tc;
  // highp float len = length(p);
  // highp vec2 uv = tc + (p/len)*cos(len*6.0-time*2.0)*0.01;
  // highp vec4 col = texture2D(tex,uv);
  // gl_FragColor = col;



  highp vec2 uv = coord.xy;
  highp vec2 texCoord = uv;
  highp float dist = distance(uv, center);
  if ((dist >= (time - shockParams.z)) && (dist <= (time + shockParams.z))) 
  {
      highp float diff = (dist - time); 
      highp float powDiff = 1.0 - pow(abs(diff*shockParams.x), shockParams.y); 
      highp float diffTime = diff * powDiff; 
      highp vec2 diffUV = normalize(uv - center); 
      texCoord = uv + (diffUV * diffTime);
  }
  gl_FragColor = texture2D(tex, texCoord);
}
