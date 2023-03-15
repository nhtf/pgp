

// Helper vector. If you're doing anything that involves regular triangles or hexagons, the
// 30-60-90 triangle will be involved in some way, which has sides of 1, sqrt(3) and 2.
const highp vec2 s = vec2(1.7320508, 1);

highp float hash21(highp vec2 p)
{
    return fract(sin(dot(p, vec2(141.13, 289.97)))*43758.5453);
}

// The 2D hexagonal isosuface function: If you were to render a horizontal line and one that
// slopes at 60 degrees, mirror, then combine them, you'd arrive at the following. As an aside,
// the function is a bound -- as opposed to a Euclidean distance representation, but either
// way, the result is hexagonal boundary lines.
highp float hex(in highp vec2 p)
{    
    p = abs(p);

    return max(dot(p, s*.5), p.y); // Hexagon. 
}

// This function returns the hexagonal grid coordinate for the grid cell, and the corresponding 
// hexagon cell ID -- in the form of the central hexagonal point. That's basically all you need to 
// produce a hexagonal grid.
//
// When working with 2D, I guess it's not that important to streamline this particular function.
// However, if you need to raymarch a hexagonal grid, the number of operations tend to matter.
// This one has minimal setup, one "floor" call, a couple of "dot" calls, a ternary operator, etc.
// To use it to raymarch, you'd have to double up on everything -- in order to deal with 
// overlapping fields from neighboring cells, so the fewer operations the better.
highp vec4 getHex(highp vec2 p)
{    
    // The hexagon centers: Two sets of repeat hexagons are required to fill in the space, and
    // the two sets are stored in a "vec4" in order to group some calculations together. The hexagon
    // center we'll eventually use will depend upon which is closest to the current point. Since 
    // the central hexagon point is unique, it doubles as the unique hexagon ID.
    
    highp vec4 hC = floor(vec4(p, p - vec2(1, .5))/s.xyxy) + .5;
    
    // Centering the coordinates with the hexagon centers above.
    highp vec4 h = vec4(p - hC.xy*s, p - (hC.zw + .5)*s);
    
    
    // Nearest hexagon center (with respect to p) to the current point. In other words, when
    // "h.xy" is zero, we're at the center. We're also returning the corresponding hexagon ID -
    // in the form of the hexagonal central point.
    //
    // On a side note, I sometimes compare hex distances, but I noticed that Iomateron compared
    // the squared Euclidian version, which seems neater, so I've adopted that.
    return dot(h.xy, h.xy) < dot(h.zw, h.zw) 
        ? vec4(h.xy, hC.xy) 
        : vec4(h.zw, hC.zw + .5);
}


uniform sampler2D tex;
uniform highp vec2 size; //Size of the canvas/image
uniform highp vec2 resolution; //Size of the /image
varying highp vec2 coord;
uniform highp float time; // time in seconds
uniform highp vec2 center; // origin position ripple
uniform highp vec3 shockParams; // 10.0, 0.8, 0.1

const highp float Hexrows = 9.;

highp vec3 grid()
{
    // Aspect correct screen coordinates.
	highp vec2 u = (gl_FragCoord.xy - size * .5) / size.y;
    
    // Scaling, translating, then converting it to a hexagonal grid cell coordinate and
    // a unique coordinate ID. The resultant vector contains everything you need to produce a
    // pretty pattern, so what you do from here is up to you.
    highp vec4 h = getHex(u * Hexrows + s.yx/2.);
    
    // The beauty of working with hexagonal centers is that the relative edge distance will simply 
    // be the value of the 2D isofield for a hexagon.
    highp float eDist = hex(h.xy); // Edge distance.

    highp vec3 bkg = vec3(0., 0., 0.);
    highp vec3 border = vec3(0.29, 0.29, .29);
    highp float thickness = 0.05;
    // highp float blink = smoothstep(0., .125, rnd - .666);
    highp vec3 col = mix(bkg, border, smoothstep(0., thickness, eDist - .5 + .04));   
    return col;
}

#define M_PI 3.1415926535897932384626433832795

highp float rand(highp vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

highp vec3 stars(highp float starSize)
{
    highp float sizeStars = starSize;
	highp float prob = 0.99;
	highp vec2 pos = floor(1.0 / sizeStars * gl_FragCoord.xy);
	
	
	highp float color = 0.0;
	highp float starValue = rand(pos);
	
	if (starValue > prob)
	{
		highp vec2 center = sizeStars * pos + vec2(sizeStars, sizeStars) * 0.5;
		
		highp float t = 0.9 + 0.2 * sin((starValue - prob) / (1.0 - prob) * 45.0);
				
		color = 1.0 - distance(gl_FragCoord.xy, center) / (0.5 * sizeStars);
		color = color * t / (abs(gl_FragCoord.y - center.y)) * t / (abs(gl_FragCoord.x - center.x));
	}
	else if (rand(gl_FragCoord.xy / size.xy) > 0.996)
	{
		highp float r = rand(gl_FragCoord.xy);
		color = r * (0.25 * sin((r * 5.0) + 720.0 * r) + 0.75);
	}
	return vec3(color);
}

//TODO make the stars fluctuate slightly with time
highp vec3 starColor() {
    highp vec3 smallStars = stars(6.);
    highp vec3 mediumStars = stars(8.);
    highp vec3 bigStars = stars(12.);
    highp vec3 col = smallStars + mediumStars + bigStars;
    return col;
}

void main()
{
    highp vec3 gridColor = grid();
    highp vec3 starColor = starColor();
    highp vec3 col = mix(gridColor,starColor, 0.4);
    col = col + 0.5 * gridColor;
    gl_FragColor = vec4(col, 1);
}