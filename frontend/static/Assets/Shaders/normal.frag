uniform sampler2D tex;
varying highp vec2 coord;

void main()
{
  gl_FragColor = texture2D(tex, coord);
}