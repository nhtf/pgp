function clone(point: number[]) {
    return [point[0], point[1]]
}

function vec2(x: number, y: number) {
    return [x, y]
}

//TODO fix the opt type
export class createBezierBuilder {


    private opt;
    private RECURSION_LIMIT: number;
    private FLT_EPSILON: number;
    private PATH_DISTANCE_EPSILON: number;
    private curve_angle_tolerance_epsilon: number;
    private m_angle_tolerance: number;
    private m_cusp_limit: number;


    constructor(opt: any) {
        this.opt = opt||{};
        this.RECURSION_LIMIT = typeof this.opt.recursion === 'number' ? this.opt.recursion : 8;
        this.FLT_EPSILON = typeof this.opt.epsilon === 'number' ? this.opt.epsilon : 1.19209290e-7;
        this.PATH_DISTANCE_EPSILON = typeof this.opt.pathEpsilon === 'number' ? this.opt.pathEpsilon : 1.0;
        this.curve_angle_tolerance_epsilon = typeof this.opt.angleEpsilon === 'number' ? this.opt.angleEpsilon : 0.01;
        this.m_angle_tolerance = this.opt.angleTolerance || 0;
        this.m_cusp_limit = this.opt.cuspLimit || 0;
    }

    public bezierCurve(start: number[], c1: number[], c2: number[], end: number[], scale: number, points: number[][]) {
        if (!points)
            points = [];

        scale = typeof scale === 'number' ? scale : 1.0;
        var distanceTolerance = this.PATH_DISTANCE_EPSILON / scale;
        distanceTolerance *= distanceTolerance;
        this.begin(start, c1, c2, end, points, distanceTolerance);
        return points;
    }


    ////// Based on:
    ////// https://github.com/pelson/antigrain/blob/master/agg-2.4/src/agg_curves.cpp

    private begin(start: number[], c1: number[], c2: number[], end: number[], points: number[][], distanceTolerance: number) {
        points.push(clone(start));
        var x1 = start[0],
            y1 = start[1],
            x2 = c1[0],
            y2 = c1[1],
            x3 = c2[0],
            y3 = c2[1],
            x4 = end[0],
            y4 = end[1];
        this.recursive(x1, y1, x2, y2, x3, y3, x4, y4, points, distanceTolerance, 0);
        points.push(clone(end));
    }

    private recursive(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, points: number[][], distanceTolerance: number, level: number) {
        if(level > this.RECURSION_LIMIT) 
            return;

        var pi = Math.PI;

        // Calculate all the mid-points of the line segments
        //----------------------
        var x12   = (x1 + x2) / 2;
        var y12   = (y1 + y2) / 2;
        var x23   = (x2 + x3) / 2;
        var y23   = (y2 + y3) / 2;
        var x34   = (x3 + x4) / 2;
        var y34   = (y3 + y4) / 2;
        var x123  = (x12 + x23) / 2;
        var y123  = (y12 + y23) / 2;
        var x234  = (x23 + x34) / 2;
        var y234  = (y23 + y34) / 2;
        var x1234 = (x123 + x234) / 2;
        var y1234 = (y123 + y234) / 2;

        if(level > 0) { // Enforce subdivision first time
            // Try to approximate the full cubic curve by a single straight line
            //------------------
            var dx = x4-x1;
            var dy = y4-y1;

            var d2 = Math.abs((x2 - x4) * dy - (y2 - y4) * dx);
            var d3 = Math.abs((x3 - x4) * dy - (y3 - y4) * dx);

            var da1, da2;

            if(d2 > this.FLT_EPSILON && d3 > this.FLT_EPSILON) {
                // Regular care
                //-----------------
                if((d2 + d3)*(d2 + d3) <= distanceTolerance * (dx*dx + dy*dy)) {
                    // If the curvature doesn't exceed the distanceTolerance value
                    // we tend to finish subdivisions.
                    //----------------------
                    if(this.m_angle_tolerance < this.curve_angle_tolerance_epsilon) {
                        points.push(vec2(x1234, y1234));
                        return;
                    }

                    // Angle & Cusp Condition
                    //----------------------
                    var a23 = Math.atan2(y3 - y2, x3 - x2);
                    da1 = Math.abs(a23 - Math.atan2(y2 - y1, x2 - x1));
                    da2 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - a23);
                    if(da1 >= pi) da1 = 2*pi - da1;
                    if(da2 >= pi) da2 = 2*pi - da2;

                    if(da1 + da2 < this.m_angle_tolerance) {
                        // Finally we can stop the recursion
                        //----------------------
                        points.push(vec2(x1234, y1234));
                        return;
                    }

                    if(this.m_cusp_limit !== 0.0) {
                        if(da1 > this.m_cusp_limit) {
                            points.push(vec2(x2, y2));
                            return;
                        }

                        if(da2 > this.m_cusp_limit) {
                            points.push(vec2(x3, y3));
                            return;
                        }
                    }
                }
            }
            else {
                if(d2 > this.FLT_EPSILON) {
                    // p1,p3,p4 are collinear, p2 is considerable
                    //----------------------
                    if(d2 * d2 <= distanceTolerance * (dx*dx + dy*dy)) {
                        if(this.m_angle_tolerance < this.curve_angle_tolerance_epsilon) {
                            points.push(vec2(x1234, y1234));
                            return;
                        }

                        // Angle Condition
                        //----------------------
                        da1 = Math.abs(Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y2 - y1, x2 - x1))
                        if(da1 >= pi) da1 = 2*pi - da1

                        if(da1 < this.m_angle_tolerance) {
                            points.push(vec2(x2, y2));
                            points.push(vec2(x3, y3));
                            return;
                        }

                        if(this.m_cusp_limit !== 0.0) {
                            if(da1 > this.m_cusp_limit) {
                                points.push(vec2(x2, y2));
                                return;
                            }
                        }
                    }
                }
                else if(d3 > this.FLT_EPSILON) {
                    // p1,p2,p4 are collinear, p3 is considerable
                    //----------------------
                    if(d3 * d3 <= distanceTolerance * (dx*dx + dy*dy)) {
                        if(this.m_angle_tolerance < this.curve_angle_tolerance_epsilon) {
                            points.push(vec2(x1234, y1234));
                            return;
                        }

                        // Angle Condition
                        //----------------------
                        da1 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y3 - y2, x3 - x2))
                        if(da1 >= pi) da1 = 2*pi - da1;

                        if(da1 < this.m_angle_tolerance) {
                            points.push(vec2(x2, y2));
                            points.push(vec2(x3, y3));
                            return;
                        }

                        if(this.m_cusp_limit !== 0.0) {
                            if(da1 > this.m_cusp_limit)
                            {
                                points.push(vec2(x3, y3));
                                return;
                            }
                        }
                    }
                }
                else {
                    // Collinear case
                    //-----------------
                    dx = x1234 - (x1 + x4) / 2;
                    dy = y1234 - (y1 + y4) / 2;
                    if(dx*dx + dy*dy <= distanceTolerance) {
                        points.push(vec2(x1234, y1234));
                        return;
                    }
                }
            }
        }

        // Continue subdivision
        //----------------------
        this.recursive(x1, y1, x12, y12, x123, y123, x1234, y1234, points, distanceTolerance, level + 1);
        this.recursive(x1234, y1234, x234, y234, x34, y34, x4, y4, points, distanceTolerance, level + 1);
    }
}