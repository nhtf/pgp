
interface Xtend {
    <T extends object, U extends object>(target: T, source: U): T & U;
    <T extends object, U extends object, V extends object>(target: T, source1: U, source2: V): T & U & V;
    <T extends object, U extends object, V extends object, W extends object>(
        target: T,
        source1: U,
        source2: V,
        source3: W,
    ): T & U & V & W;
    <T extends object, U extends object, V extends object, W extends object, Q extends object>(
        target: T,
        source1: U,
        source2: V,
        source3: W,
        source4: Q,
    ): T & U & V & W & Q;
    <T extends object, U extends object, V extends object, W extends object, Q extends object, R extends object>(
        target: T,
        source1: U,
        source2: V,
        source3: W,
        source4: Q,
        source5: R,
    ): T & U & V & W & Q & R;
    (target: object, ...sources: object[]): object;
}

//TODO why no work?
declare const xtend: Xtend;

import { tesselate } from "./Tesselator";

export function triangulate(contours, opt) {
    opt = opt||{}
    contours = contours.filter(function(c) {
        return c.length>0
    })
    
    if (contours.length === 0) {
        return { 
            positions: [],
            cells: []
        }
    }

    if (typeof opt.vertexSize !== 'number')
        opt.vertexSize = contours[0][0].length

    //flatten for tess2.js
    contours = contours.map(function(c) {
        return c.reduce(function(a, b) {
            return a.concat(b)
        })
    })

    // Tesselate
    var res = tesselate({
        contours: contours,
        windingRule: 0,
        elementType: 0,
        polySize: 3,
        vertexSize: 2
    }, opt)

    var positions = []
    for (var i=0; i<res.vertices.length; i+=opt.vertexSize) {
        var pos = res.vertices.slice(i, i+opt.vertexSize)
        positions.push(pos)
    }
    
    var cells = []
    for (i=0; i<res.elements.length; i+=3) {
        var a = res.elements[i],
            b = res.elements[i+1],
            c = res.elements[i+2]
        cells.push([a, b, c])
    }

    //return a simplicial complex
    return {
        positions: positions,
        cells: cells
    }
}