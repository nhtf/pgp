uniform sampler2D tex;
varying highp vec2 coord;
uniform highp vec2 center; // origin position ripple
uniform highp float time; // time in seconds
uniform highp vec3 shockParams; // 10.0, 0.8, 0.1

void main()
{
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
