import type {parseData} from "./parseSvgPath";
import { createBezierBuilder } from "./adaptiveBezierCurve";
import { normalize } from "./normalizeSvgPath";

//TODO also add the triangulate-contours

function abs(path: parseData[]){
	var startX = 0;
	var startY = 0;
	var x = 0;
	var y = 0;

	return path.map(function(seg){
		// seg = seg.slice();
		var type = seg.command;
		var command = type.toUpperCase();

		// is relative
		if (type != command) {
			seg.command = command;
			switch (type) {
				case 'a':
					seg.args[5] += x;
					seg.args[6] += y;
					break;
				case 'v':
					seg.args[0] += y;
					break;
				case 'h':
					seg.args[0] += x;
					break;
				default:
					for (var i = 0; i < seg.args.length;) {
						seg.args[i++] += x;
						seg.args[i++] += y;
					}
			}
		}

		// update cursor state
		switch (command) {
			case 'Z':
				x = startX;
				y = startY;
				break;
			case 'H':
				x = seg.args[0];
				break;
			case 'V':
				y = seg.args[0];
				break;
			case 'M':
				x = startX = seg.args[0];
				y = startY = seg.args[1];
				break;
			default:
				x = seg.args[seg.args.length - 2];
				y = seg.args[seg.args.length - 1];
		}

		return seg;
	})
}

function vec2Copy(out: number[], a: number[]) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
}

const option = 
{
    recursion: 8,
    epsilon: 1.19209290e-7,
    pathEpsilon: 0.5,
    angleEpsilon: 0.01,
    angleTolerance: 0,
    cuspLimit: 0,
}

const bezierBuilder = new createBezierBuilder(option);

function set(out: number[], x: number, y: number) {
    out[0] = x;
    out[1] = y;
    return out;
}

let tmp1 = [0,0],
    tmp2 = [0,0],
    tmp3 = [0,0];

function bezierTo(points: number[][], scale: number, start: number[], seg: number[]) {
    bezierBuilder.bezierCurve(start, 
        set(tmp1, seg[0], seg[1]), 
        set(tmp2, seg[2], seg[3]),
        set(tmp3, seg[4], seg[5]), scale, points)
}

export function contours(svg: parseData[], scale: number) {
    let paths: number[][][] = [];

    let points: number[][] = [];
    let pen = [0, 0];
    normalize(abs(svg)).forEach(function(segment, i, self) {
        if (segment.command === 'M') {
            vec2Copy(pen, segment.args);
            //this is in case there are multiple moveto in the svg
            if (points.length>0) {
                paths.push(points);
                points = [];
            }
        } else if (segment.command === 'C') {
            bezierTo(points, scale, pen, segment.args);
            set(pen, segment.args[4], segment.args[5]);
        } else {
            throw new Error('illegal type in SVG: '+segment.command);
        }
    });
    if (points.length > 0) {
        paths.push(points);
    }
    return paths;
}