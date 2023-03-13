
import { tesselate } from "./Tesselator";

export function triangulate(contours: number[][][]) {
    contours = contours.filter(function(c) {
        return c.length>0
    })
    
    if (contours.length === 0) {
        return { 
            positions: [],
            cells: []
        }
    }

    //flatten for tess2.js
    let flattenContours = contours.map(function(c) {
        return c.reduce(function(a, b) {
            return a.concat(b)
        })
    });

    // Tesselate
    var res = tesselate({
        contours: flattenContours,
        windingRule: 0,
        elementType: 0,
        polySize: 3,
        vertexSize: 2
    });

    var positions = []
    for (var i = 0; i < res.vertices.length; i += 2) {
        var pos = res.vertices.slice(i, i + 2)
        positions.push(pos)
    }
    
    var cells = []
    for (i = 0; i < res.elements.length; i += 3) {
        var a = res.elements[i],
            b = res.elements[i + 1],
            c = res.elements[i + 2]
        cells.push([a, b, c])
    }

    //return a simplicial complex
    return {
        positions: positions,
        cells: cells
    }
}