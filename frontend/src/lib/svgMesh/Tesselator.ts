/*
** SGI FREE SOFTWARE LICENSE B (Version 2.0, Sept. 18, 2008) 
** Copyright (C) [dates of first publication] Silicon Graphics, Inc.
** All Rights Reserved.
**
** Permission is hereby granted, free of charge, to any person obtaining a copy
** of this software and associated documentation files (the "Software"), to deal
** in the Software without restriction, including without limitation the rights
** to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
** of the Software, and to permit persons to whom the Software is furnished to do so,
** subject to the following conditions:
** 
** The above copyright notice including the dates of first publication and either this
** permission notice or a reference to http://oss.sgi.com/projects/FreeB/ shall be
** included in all copies or substantial portions of the Software. 
**
** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
** INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
** PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL SILICON GRAPHICS, INC.
** BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
** OR OTHER DEALINGS IN THE SOFTWARE.
** 
** Except as contained in this notice, the name of Silicon Graphics, Inc. shall not
** be used in advertising or otherwise to promote the sale, use or other dealings in
** this Software without prior written authorization from Silicon Graphics, Inc.
*/
/*
** Author: Mikko Mononen, Aug 2013.
** The code is based on GLU libtess by Eric Veach, July 1994
*/

import {sweep as Sweep} from "./Sweep";
import { Geom } from "./Geom";

type options = {
    contours: number[][];
    windingRule?: number;
    elementType?: number;
    polySize?: number;
    vertexSize?: number;
    debug?: boolean;
    normal?: number[];
}


//TODO clean this up, type it and split it up in seperate files!
//TODO remove the npm modules I used to make this
export function tesselate(opts: options) {
    var debug =  opts.debug || false;
    var tess = new Tesselator();
    for (var i = 0; i < opts.contours.length; i++) {
        tess.addContour(opts.vertexSize || 2, opts.contours[i]);
    }
    tess.tesselate(opts.windingRule || Tess2.WINDING_ODD,
                   opts.elementType || Tess2.POLYGONS,
                   opts.polySize || 3,
                   opts.vertexSize || 2,
                   opts.normal || [0,0,1]);
    return {
        vertices: tess.vertices,
        vertexIndices: tess.vertexIndices,
        vertexCount: tess.vertexCount,
        elements: tess.elements,
        elementCount: tess.elementCount,
        mesh: debug ? tess.mesh : undefined
    };
};

export function assert(cond: boolean) {
    if (!cond) {
        throw "Assertion Failed!";
    }
}

export class TESSvertex {
    public next: TESSvertex | null;
    public prev: TESSvertex | null;
    public anEdge: TESShalfEdge| null;
    public coords;
    public s;
    public t;
    public pqHandle;
    public n;
    public idx;


    constructor() {
        this.next = null;	/* next vertex (never NULL) */
        this.prev = null;	/* previous vertex (never NULL) */
        this.anEdge = null;	/* a half-edge with this origin */
    
        /* Internal data (keep hidden) */
        this.coords = [0,0,0];	/* vertex location in 3D */
        this.s = 0.0;
        this.t = 0.0;			/* projection onto the sweep plane */
        this.pqHandle = 0;		/* to allow deletion from priority queue */
        this.n = 0;				/* to allow identify unique vertices */
        this.idx = 0;			/* to allow map result to original verts */
    }
} 

export class TESSface {

    public next: TESSface | null;
    public prev: TESSface | null;
    public anEdge: TESShalfEdge| null;
    public trail: null;
    public marked;
    public inside;
    public n;
    
    constructor () {
        this.next = null;		/* next face (never NULL) */
		this.prev = null;		/* previous face (never NULL) */
		this.anEdge = null;		/* a half edge with this left face */
	
		/* Internal data (keep hidden) */
		this.trail = null;		/* "stack" for conversion to strips */
		this.n = 0;				/* to allow identiy unique faces */
		this.marked = false;	/* flag for conversion to strips */
		this.inside = false;	/* this face is in the polygon interior */
    }
};

export class TESShalfEdge {
    public next: TESShalfEdge | null;
    public Sym: TESShalfEdge | null;
    public Onext: TESShalfEdge | null;
    public Lnext: TESShalfEdge | null;
    public Org: TESSvertex | null;
    public Lface: TESSface | null;
    public activeRegion: ActiveRegion | null;
    public winding;
    public side: number;

    constructor(side: number) {
        this.next = null;		/* doubly-linked list (prev==Sym->next) */
        this.Sym = null;		/* same edge, opposite direction */
        this.Onext = null;		/* next edge CCW around origin */
        this.Lnext = null;		/* next edge CCW around left face */
        this.Org = null;		/* origin vertex (Overtex too long) */
        this.Lface = null;		/* left face */
    
        /* Internal data (keep hidden) */
        this.activeRegion = null;	/* a region with this upper edge (sweep.c) */
        this.winding = 0;			/* change in winding number when crossing
                                    from the right face to the left face */
        this.side = side;
    }

    public get Rface() { return this.Sym?.Lface; }
    public set Rface(v) { this.Sym!.Lface = v!; }
    public get Dst() { return this.Sym?.Org; }
    public set Dst(v) { this.Sym!.Org = v!; }
    public get Oprev() { return this.Sym?.Lnext; }
    public set Oprev(v) { this.Sym!.Lnext = v!; }
    public get Lprev() { return this.Onext?.Sym; }
    public set Lprev(v) { this.Onext!.Sym = v!; }
    public get Dprev() { return this.Lnext?.Sym; }
    public set Dprev(v) { this.Lnext!.Sym = v!; }
    public get Rprev() { return this.Sym?.Onext; }
    public set Rprev(v) { this.Sym!.Onext = v!; }
    public get Dnext() { return /*this.Rprev*/this.Sym?.Onext?.Sym; }  /* 3 pointers */
    public set Dnext(v) { /*this.Rprev*/this.Sym!.Onext!.Sym = v!; }  /* 3 pointers */
    public get Rnext() { return /*this.Oprev*/this.Sym?.Lnext?.Sym; }  /* 3 pointers */
    public set Rnext(v) { /*this.Oprev*/this.Sym!.Lnext!.Sym = v!; } /* 3 pointers */
};

export class TESSmesh {

    public vHead;
    public fHead;
    public eHead;
    public eHeadSym;

    constructor() {
        var v = new TESSvertex();
        var f = new TESSface();
        var e = new TESShalfEdge(0);
        var eSym = new TESShalfEdge(1);

        v.next = v.prev = v;
        v.anEdge = null;

        f.next = f.prev = f;
        f.anEdge = null;
        f.trail = null;
        f.marked = false;
        f.inside = false;

        e.next = e;
        e.Sym = eSym;
        e.Onext = null;
        e.Lnext = null;
        e.Org = null;
        e.Lface = null;
        e.winding = 0;
        e.activeRegion = null;

        eSym.next = eSym;
        eSym.Sym = e;
        eSym.Onext = null;
        eSym.Lnext = null;
        eSym.Org = null;
        eSym.Lface = null;
        eSym.winding = 0;
        eSym.activeRegion = null;

        this.vHead = v;		/* dummy header for vertex list */
        this.fHead = f;		/* dummy header for face list */
        this.eHead = e;		/* dummy header for edge list */
        this.eHeadSym = eSym;	/* and its symmetric counterpart */
    }


		/* MakeEdge creates a new pair of half-edges which form their own loop.
		* No vertex or face structures are allocated, but these must be assigned
		* before the current edge operation is completed.
		*/
		//static TESShalfEdge *MakeEdge( TESSmesh* mesh, TESShalfEdge *eNext )
		makeEdge_(eNext: TESShalfEdge) {
			var e = new TESShalfEdge(0);
			var eSym = new TESShalfEdge(1);

			/* Make sure eNext points to the first edge of the edge pair */
			if( eNext.Sym!.side! < eNext.side ) { eNext = eNext.Sym!; }

			/* Insert in circular doubly-linked list before eNext.
			* Note that the prev pointer is stored in Sym->next.
			*/
			var ePrev = eNext.Sym!.next!;
			eSym.next = ePrev;
			ePrev!.Sym!.next = e;
			e.next = eNext;
			eNext!.Sym!.next = eSym;

			e.Sym = eSym;
			e.Onext = e;
			e.Lnext = eSym;
			e.Org = null;
			e.Lface = null;
			e.winding = 0;
			e.activeRegion = null;

			eSym.Sym = e;
			eSym.Onext = eSym;
			eSym.Lnext = e;
			eSym.Org = null;
			eSym.Lface = null;
			eSym.winding = 0;
			eSym.activeRegion = null;

			return e;
		}

		/* Splice( a, b ) is best described by the Guibas/Stolfi paper or the
		* CS348a notes (see mesh.h).  Basically it modifies the mesh so that
		* a->Onext and b->Onext are exchanged.  This can have various effects
		* depending on whether a and b belong to different face or vertex rings.
		* For more explanation see tessMeshSplice() below.
		*/
		// static void Splice( TESShalfEdge *a, TESShalfEdge *b )
		splice_(a: TESShalfEdge, b: TESShalfEdge) {
			var aOnext = a.Onext;
			var bOnext = b.Onext;
			aOnext!.Sym!.Lnext = b;
			bOnext!.Sym!.Lnext = a;
			a.Onext = bOnext;
			b.Onext = aOnext;
		}

		/* MakeVertex( newVertex, eOrig, vNext ) attaches a new vertex and makes it the
		* origin of all edges in the vertex loop to which eOrig belongs. "vNext" gives
		* a place to insert the new vertex in the global vertex list.  We insert
		* the new vertex *before* vNext so that algorithms which walk the vertex
		* list will not see the newly created vertices.
		*/
		//static void MakeVertex( TESSvertex *newVertex, TESShalfEdge *eOrig, TESSvertex *vNext )
		makeVertex_(newVertex: TESSvertex, eOrig: TESShalfEdge, vNext: TESSvertex) {
			var vNew = newVertex;
			assert(vNew !== null);

			/* insert in circular doubly-linked list before vNext */
			var vPrev = vNext.prev;
			vNew.prev = vPrev;
			vPrev!.next = vNew;
			vNew.next = vNext;
			vNext.prev = vNew;

			vNew.anEdge = eOrig;
			/* leave coords, s, t undefined */

			/* fix other edges on this vertex loop */
			var e = eOrig;
			do {
				e.Org = vNew;
				e = e.Onext!;
			} while(e !== eOrig);
		}

		/* MakeFace( newFace, eOrig, fNext ) attaches a new face and makes it the left
		* face of all edges in the face loop to which eOrig belongs.  "fNext" gives
		* a place to insert the new face in the global face list.  We insert
		* the new face *before* fNext so that algorithms which walk the face
		* list will not see the newly created faces.
		*/
		// static void MakeFace( TESSface *newFace, TESShalfEdge *eOrig, TESSface *fNext )
		makeFace_(newFace: TESSface, eOrig: TESShalfEdge, fNext: TESSface) {
			var fNew = newFace;
			assert(fNew !== null); 

			/* insert in circular doubly-linked list before fNext */
			var fPrev = fNext.prev;
			fNew.prev = fPrev;
			fPrev!.next = fNew;
			fNew.next = fNext;
			fNext.prev = fNew;

			fNew.anEdge = eOrig;
			fNew.trail = null;
			fNew.marked = false;

			/* The new face is marked "inside" if the old one was.  This is a
			* convenience for the common case where a face has been split in two.
			*/
			fNew.inside = fNext.inside;

			/* fix other edges on this face loop */
			var e = eOrig;
			do {
				e.Lface = fNew;
				e = e.Lnext!;
			} while(e !== eOrig);
		}

		/* KillEdge( eDel ) destroys an edge (the half-edges eDel and eDel->Sym),
		* and removes from the global edge list.
		*/
		//static void KillEdge( TESSmesh *mesh, TESShalfEdge *eDel )
		killEdge_(eDel: TESShalfEdge) {
			/* Half-edges are allocated in pairs, see EdgePair above */
			if( eDel!.Sym!.side < eDel.side ) { eDel = eDel.Sym!; }

			/* delete from circular doubly-linked list */
			var eNext = eDel.next;
			var ePrev = eDel!.Sym!.next;
			eNext!.Sym!.next = ePrev;
			ePrev!.Sym!.next = eNext;
		}


		/* KillVertex( vDel ) destroys a vertex and removes it from the global
		* vertex list.  It updates the vertex loop to point to a given new vertex.
		*/
		//static void KillVertex( TESSmesh *mesh, TESSvertex *vDel, TESSvertex *newOrg )
		killVertex_(vDel: TESSvertex, newOrg: TESSvertex | null) {
			var eStart = vDel.anEdge;
			/* change the origin of all affected edges */
			var e = eStart;
			do {
				e!.Org = newOrg;
				e = e!.Onext;
			} while(e !== eStart);

			/* delete from circular doubly-linked list */
			var vPrev = vDel.prev;
			var vNext = vDel.next;
			vNext!.prev = vPrev;
			vPrev!.next = vNext;
		}

		/* KillFace( fDel ) destroys a face and removes it from the global face
		* list.  It updates the face loop to point to a given new face.
		*/
		//static void KillFace( TESSmesh *mesh, TESSface *fDel, TESSface *newLface )
		killFace_(fDel: TESSface, newLface: TESSface | null) {
			var eStart = fDel.anEdge;

			/* change the left face of all affected edges */
			var e = eStart;
			do {
				e!.Lface = newLface;
				e = e!.Lnext;
			} while(e !== eStart);

			/* delete from circular doubly-linked list */
			var fPrev = fDel.prev;
			var fNext = fDel.next;
			fNext!.prev = fPrev;
			fPrev!.next = fNext;
		}

		/****************** Basic Edge Operations **********************/

		/* tessMeshMakeEdge creates one edge, two vertices, and a loop (face).
		* The loop consists of the two new half-edges.
		*/
		//TESShalfEdge *tessMeshMakeEdge( TESSmesh *mesh )
		makeEdge() {
			var newVertex1 = new TESSvertex();
			var newVertex2 = new TESSvertex();
			var newFace = new TESSface();
			var e = this.makeEdge_( this.eHead);
			this.makeVertex_( newVertex1, e, this.vHead );
			this.makeVertex_( newVertex2, e.Sym!, this.vHead );
			this.makeFace_( newFace, e, this.fHead );
			return e;
		}

		/* tessMeshSplice( eOrg, eDst ) is the basic operation for changing the
		* mesh connectivity and topology.  It changes the mesh so that
		*	eOrg->Onext <- OLD( eDst->Onext )
		*	eDst->Onext <- OLD( eOrg->Onext )
		* where OLD(...) means the value before the meshSplice operation.
		*
		* This can have two effects on the vertex structure:
		*  - if eOrg->Org != eDst->Org, the two vertices are merged together
		*  - if eOrg->Org == eDst->Org, the origin is split into two vertices
		* In both cases, eDst->Org is changed and eOrg->Org is untouched.
		*
		* Similarly (and independently) for the face structure,
		*  - if eOrg->Lface == eDst->Lface, one loop is split into two
		*  - if eOrg->Lface != eDst->Lface, two distinct loops are joined into one
		* In both cases, eDst->Lface is changed and eOrg->Lface is unaffected.
		*
		* Some special cases:
		* If eDst == eOrg, the operation has no effect.
		* If eDst == eOrg->Lnext, the new face will have a single edge.
		* If eDst == eOrg->Lprev, the old face will have a single edge.
		* If eDst == eOrg->Onext, the new vertex will have a single edge.
		* If eDst == eOrg->Oprev, the old vertex will have a single edge.
		*/
		//int tessMeshSplice( TESSmesh* mesh, TESShalfEdge *eOrg, TESShalfEdge *eDst )
		splice(eOrg: TESShalfEdge, eDst: TESShalfEdge) {
			var joiningLoops = false;
			var joiningVertices = false;

			if( eOrg === eDst ) return;

			if( eDst.Org !== eOrg.Org ) {
				/* We are merging two disjoint vertices -- destroy eDst->Org */
				joiningVertices = true;
				this.killVertex_( eDst.Org!, eOrg.Org );
			}
			if( eDst.Lface !== eOrg.Lface ) {
				/* We are connecting two disjoint loops -- destroy eDst->Lface */
				joiningLoops = true;
				this.killFace_( eDst.Lface!, eOrg.Lface );
			}

			/* Change the edge structure */
			this.splice_( eDst, eOrg );

			if( ! joiningVertices ) {
				var newVertex = new TESSvertex();

				/* We split one vertex into two -- the new vertex is eDst->Org.
				* Make sure the old vertex points to a valid half-edge.
				*/
				this.makeVertex_( newVertex, eDst, eOrg.Org! );
				eOrg.Org!.anEdge = eOrg;
			}
			if( ! joiningLoops ) {
				var newFace = new TESSface();  

				/* We split one loop into two -- the new loop is eDst->Lface.
				* Make sure the old face points to a valid half-edge.
				*/
				this.makeFace_( newFace, eDst, eOrg.Lface! );
				eOrg.Lface!.anEdge = eOrg;
			}
		}

		/* tessMeshDelete( eDel ) removes the edge eDel.  There are several cases:
		* if (eDel->Lface != eDel->Rface), we join two loops into one; the loop
		* eDel->Lface is deleted.  Otherwise, we are splitting one loop into two;
		* the newly created loop will contain eDel->Dst.  If the deletion of eDel
		* would create isolated vertices, those are deleted as well.
		*
		* This function could be implemented as two calls to tessMeshSplice
		* plus a few calls to memFree, but this would allocate and delete
		* unnecessary vertices and faces.
		*/
		//int tessMeshDelete( TESSmesh *mesh, TESShalfEdge *eDel )
		delete(eDel: TESShalfEdge) {
			var eDelSym = eDel.Sym;
			var joiningLoops = false;

			/* First step: disconnect the origin vertex eDel->Org.  We make all
			* changes to get a consistent mesh in this "intermediate" state.
			*/
			if( eDel.Lface !== eDel.Rface ) {
				/* We are joining two loops into one -- remove the left face */
				joiningLoops = true;
				this.killFace_( eDel.Lface!, eDel.Rface! );
			}

			if( eDel.Onext === eDel ) {
				this.killVertex_( eDel.Org!, null );
			} else {
				/* Make sure that eDel->Org and eDel->Rface point to valid half-edges */
				eDel.Rface!.anEdge = eDel.Oprev!;
				eDel.Org!.anEdge = eDel.Onext!;

				this.splice_( eDel, eDel.Oprev! );
				if( ! joiningLoops ) {
					var newFace = new TESSface();

					/* We are splitting one loop into two -- create a new loop for eDel. */
					this.makeFace_( newFace, eDel, eDel.Lface! );
				}
			}

			/* Claim: the mesh is now in a consistent state, except that eDel->Org
			* may have been deleted.  Now we disconnect eDel->Dst.
			*/
			if( eDelSym!.Onext === eDelSym ) {
				this.killVertex_( eDelSym!.Org!, null );
				this.killFace_( eDelSym!.Lface!, null );
			} else {
				/* Make sure that eDel->Dst and eDel->Lface point to valid half-edges */
				eDel.Lface!.anEdge! = eDelSym!.Oprev!;
				eDelSym!.Org!.anEdge = eDelSym!.Onext!;
				this.splice_( eDelSym!, eDelSym!.Oprev! );
			}

			/* Any isolated vertices or faces have already been freed. */
			this.killEdge_( eDel );
		}

		/******************** Other Edge Operations **********************/

		/* All these routines can be implemented with the basic edge
		* operations above.  They are provided for convenience and efficiency.
		*/


		/* tessMeshAddEdgeVertex( eOrg ) creates a new edge eNew such that
		* eNew == eOrg->Lnext, and eNew->Dst is a newly created vertex.
		* eOrg and eNew will have the same left face.
		*/
		// TESShalfEdge *tessMeshAddEdgeVertex( TESSmesh *mesh, TESShalfEdge *eOrg );
		addEdgeVertex(eOrg: TESShalfEdge) {
			var eNew = this.makeEdge_( eOrg );
			var eNewSym = eNew.Sym;

			/* Connect the new edge appropriately */
			this.splice_( eNew, eOrg.Lnext! );

			/* Set the vertex and face information */
			eNew.Org = eOrg.Dst!;

			var newVertex = new TESSvertex();
			this.makeVertex_( newVertex, eNewSym!, eNew.Org );

			eNew.Lface = eNewSym!.Lface = eOrg.Lface!;

			return eNew;
		}


		/* tessMeshSplitEdge( eOrg ) splits eOrg into two edges eOrg and eNew,
		* such that eNew == eOrg->Lnext.  The new vertex is eOrg->Dst == eNew->Org.
		* eOrg and eNew will have the same left face.
		*/
		// TESShalfEdge *tessMeshSplitEdge( TESSmesh *mesh, TESShalfEdge *eOrg );
		splitEdge(eOrg: TESShalfEdge, eDst?: TESShalfEdge) {
			var tempHalfEdge = this.addEdgeVertex( eOrg );
			var eNew = tempHalfEdge.Sym;

			/* Disconnect eOrg from eOrg->Dst and connect it to eNew->Org */
			this.splice_( eOrg.Sym!, eOrg.Sym!.Oprev! );
			this.splice_( eOrg.Sym!, eNew! );

			/* Set the vertex and face information */
			eOrg.Dst = eNew!.Org!;
			eNew!.Dst!.anEdge = eNew!.Sym!;	/* may have pointed to eOrg->Sym */
			eNew!.Rface = eOrg.Rface;
			eNew!.winding = eOrg.winding;	/* copy old winding information */
			eNew!.Sym!.winding = eOrg!.Sym!.winding;

			return eNew;
		}


		/* tessMeshConnect( eOrg, eDst ) creates a new edge from eOrg->Dst
		* to eDst->Org, and returns the corresponding half-edge eNew.
		* If eOrg->Lface == eDst->Lface, this splits one loop into two,
		* and the newly created loop is eNew->Lface.  Otherwise, two disjoint
		* loops are merged into one, and the loop eDst->Lface is destroyed.
		*
		* If (eOrg == eDst), the new face will have only two edges.
		* If (eOrg->Lnext == eDst), the old face is reduced to a single edge.
		* If (eOrg->Lnext->Lnext == eDst), the old face is reduced to two edges.
		*/

		// TESShalfEdge *tessMeshConnect( TESSmesh *mesh, TESShalfEdge *eOrg, TESShalfEdge *eDst );
		connect(eOrg: TESShalfEdge, eDst: TESShalfEdge) {
			var joiningLoops = false;  
			var eNew = this.makeEdge_( eOrg );
			var eNewSym = eNew.Sym;

			if( eDst.Lface !== eOrg.Lface ) {
				/* We are connecting two disjoint loops -- destroy eDst->Lface */
				joiningLoops = true;
				this.killFace_( eDst!.Lface!, eOrg.Lface );
			}

			/* Connect the new edge appropriately */
			this.splice_( eNew, eOrg.Lnext! );
			this.splice_( eNewSym!, eDst );

			/* Set the vertex and face information */
			eNew!.Org = eOrg.Dst!;
			eNewSym!.Org = eDst.Org;
			eNew.Lface = eNewSym!.Lface = eOrg.Lface;

			/* Make sure the old face points to a valid half-edge */
			eOrg!.Lface!.anEdge = eNewSym;

			if( ! joiningLoops ) {
				var newFace = new TESSface();
				/* We split one loop into two -- the new loop is eNew->Lface */
				this.makeFace_( newFace, eNew, eOrg.Lface! );
			}
			return eNew;
		}

		/* tessMeshZapFace( fZap ) destroys a face and removes it from the
		* global face list.  All edges of fZap will have a NULL pointer as their
		* left face.  Any edges which also have a NULL pointer as their right face
		* are deleted entirely (along with any isolated vertices this produces).
		* An entire mesh can be deleted by zapping its faces, one at a time,
		* in any order.  Zapped faces cannot be used in further mesh operations!
		*/
		zapFace( fZap: TESSface )
		{
			var eStart = fZap.anEdge;
			var e, eNext, eSym;
			var fPrev, fNext;

			/* walk around face, deleting edges whose right face is also NULL */
			eNext = eStart!.Lnext;
			do {
				e = eNext;
				eNext = e!.Lnext;

				e!.Lface = null;
				if( e!.Rface === null ) {
					/* delete the edge -- see TESSmeshDelete above */

					if( e!.Onext === e ) {
						this.killVertex_( e!.Org!, null );
					} else {
						/* Make sure that e->Org points to a valid half-edge */
						e!.Org!.anEdge = e!.Onext;
						this.splice_( e!, e!.Oprev! );
					}
					eSym = e!.Sym!;
					if( eSym.Onext === eSym ) {
						this.killVertex_( eSym!.Org!, null );
					} else {
						/* Make sure that eSym->Org points to a valid half-edge */
						eSym!.Org!.anEdge = eSym.Onext;
						this.splice_( eSym, eSym!.Oprev! );
					}
					this.killEdge_( e! );
				}
			} while( e != eStart );

			/* delete from circular doubly-linked list */
			fPrev = fZap.prev;
			fNext = fZap.next;
			fNext!.prev = fPrev;
			fPrev!.next = fNext;
		}

		countFaceVerts_(f: TESSface) {
			var eCur = f.anEdge;
			var n = 0;
			do
			{
				n++;
				eCur = eCur!.Lnext;
			}
			while (eCur !== f.anEdge);
			return n;
		}

		//int tessMeshMergeConvexFaces( TESSmesh *mesh, int maxVertsPerFace )
		mergeConvexFaces(maxVertsPerFace: number) {
			var f;
			var eCur, eNext, eSym;
			var vStart;
			var curNv, symNv;

			for( f = this.fHead.next; f !== this.fHead; f = f!.next )
			{
				// Skip faces which are outside the result.
				if( !f!.inside )
					continue;

				eCur = f!.anEdge;
				vStart = eCur!.Org;
					
				while (true)
				{
					eNext = eCur!.Lnext;
					eSym = eCur!.Sym;

					// Try to merge if the neighbour face is valid.
					if( eSym && eSym.Lface && eSym.Lface.inside )
					{
						// Try to merge the neighbour faces if the resulting polygons
						// does not exceed maximum number of vertices.
						curNv = this.countFaceVerts_( f! );
						symNv = this.countFaceVerts_( eSym.Lface );
						if( (curNv+symNv-2) <= maxVertsPerFace )
						{
							// Merge if the resulting poly is convex.
							if( Geom.vertCCW( eCur!.Lprev!.Org!, eCur!.Org!, eSym!.Lnext!.Lnext!.Org! ) &&
								Geom.vertCCW( eSym!.Lprev!.Org!, eSym.Org!, eCur!.Lnext!.Lnext!.Org! ) )
							{
								eNext = eSym.Lnext;
								this.delete( eSym );
								eCur = null;
								eSym = null;
							}
						}
					}
					
					if( eCur && eCur!.Lnext!.Org === vStart )
						break;
						
					// Continue to next edge.
					eCur = eNext;
				}
			}
			
			return true;
		}

		/* tessMeshCheckMesh( mesh ) checks a mesh for self-consistency.
		*/
		check() {
			var fHead = this.fHead;
			var vHead = this.vHead;
			var eHead = this.eHead;
			var f, fPrev, v, vPrev, e, ePrev;

			fPrev = fHead;
			for( fPrev = fHead ; (f = fPrev!.next) !== fHead; fPrev = f) {
				assert( f!.prev === fPrev );
				e = f!.anEdge;
				do {
					assert( e!.Sym !== e );
					assert( e!.Sym!.Sym === e );
					assert( e!.Lnext!.Onext!.Sym === e );
					assert( e!.Onext!.Sym!.Lnext === e );
					assert( e!.Lface === f );
					e = e!.Lnext;
				} while( e !== f!.anEdge );
			}
			assert( f.prev === fPrev && f.anEdge === null );

			vPrev = vHead;
			for( vPrev = vHead ; (v = vPrev!.next) !== vHead; vPrev = v) {
				assert( v!.prev === vPrev );
				e = v!.anEdge;
				do {
					assert( e!.Sym !== e );
					assert( e!.Sym!.Sym === e );
					assert( e!.Lnext!.Onext!.Sym === e );
					assert( e!.Onext!.Sym!.Lnext === e );
					assert( e!.Org === v );
					e = e!.Onext;
				} while( e !== v!.anEdge );
			}
			assert( v.prev === vPrev && v.anEdge === null );

			ePrev = eHead;
			for( ePrev = eHead ; (e = ePrev!.next) !== eHead; ePrev = e) {
				assert( e!.Sym!.next === ePrev!.Sym );
				assert( e!.Sym !== e );
				assert( e!.Sym!.Sym === e );
				assert( e!.Org !== null );
				assert( e!.Dst !== null );
				assert( e!.Lnext!.Onext!.Sym === e );
				assert( e!.Onext!.Sym!.Lnext === e );
			}
			assert( e.Sym!.next === ePrev!.Sym
				&& e.Sym === this.eHeadSym
				&& e.Sym.Sym === e
				&& e.Org === null && e.Dst === null
				&& e.Lface === null && e.Rface === null );
		}

    
};

export enum Tess2  {
    WINDING_ODD = 0,
	WINDING_NONZERO = 1,
	WINDING_POSITIVE = 2,
	WINDING_NEGATIVE = 3,
	WINDING_ABS_GEQ_TWO = 4,
	POLYGONS = 0,
	CONNECTED_POLYGONS = 1,
	BOUNDARY_CONTOURS = 2,
};

export class Tesselator {

    public mesh: TESSmesh | null;
    public normal;
    public sUnit;
    public tUnit;
    public bmin;
    public bmax;
    public windingRule: number;
    public dict: Dict | null;
    public pq: PriorityQ | null;
    public event: TESSvertex | null;
    private vertexIndexCounter;
    public vertices: number[];
    public vertexIndices: number[];
    public vertexCount;
    public elements: number[];
    public elementCount;


    constructor() {
        /*** state needed for collecting the input data ***/
            this.mesh = null;		/* stores the input contours, and eventually
            the tessellation itself */

        /*** state needed for projecting onto the sweep plane ***/

        this.normal = [0.0, 0.0, 0.0];	/* user-specified normal (if provided) */
        this.sUnit = [0.0, 0.0, 0.0];	/* unit vector in s-direction (debugging) */
        this.tUnit = [0.0, 0.0, 0.0];	/* unit vector in t-direction (debugging) */

        this.bmin = [0.0, 0.0];
        this.bmax = [0.0, 0.0];

        /*** state needed for the line sweep ***/
        this.windingRule = Tess2.WINDING_ODD;	/* rule for determining polygon interior */

        this.dict = null;		/* edge dictionary for sweep line */
        this.pq = null;		/* priority queue of vertex events */
        this.event = null;		/* current sweep event being processed */

        this.vertexIndexCounter = 0;

        this.vertices = [];
        this.vertexIndices = [];
        this.vertexCount = 0;
        this.elements = [];
        this.elementCount = 0;
    }

    private dot_(u: number[], v: number[]) {
        return (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]);
    }

    private normalize_( v: number[] ) {
        var len = v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
        assert( len > 0.0 );
        len = Math.sqrt( len );
        v[0] /= len;
        v[1] /= len;
        v[2] /= len;
    }

    private longAxis_( v: number[] ) {
        var i = 0;
        if( Math.abs(v[1]) > Math.abs(v[0]) ) { i = 1; }
        if( Math.abs(v[2]) > Math.abs(v[i]) ) { i = 2; }
        return i;
    }

    private computeNormal_( norm: number[] )
    {
        var v, v1, v2;
        var c, tLen2, maxLen2;
        var maxVal = [0,0,0], minVal = [0,0,0], d1 = [0,0,0], d2 = [0,0,0], tNorm = [0,0,0];
        var maxVert: any[] = [null,null,null], minVert: any[] = [null,null,null];
        var vHead = this.mesh!.vHead!;
        var i;

        v = vHead.next;
        for( i = 0; i < 3; ++i ) {
            c = v!.coords[i];
            minVal[i] = c;
            minVert[i] = v!;
            maxVal[i] = c;
            maxVert[i] = v!;
        }

        for( v = vHead.next; v !== vHead; v = v!.next ) {
            for( i = 0; i < 3; ++i ) {
                c = v!.coords[i];
                if( c < minVal[i] ) { minVal[i] = c; minVert[i] = v; }
                if( c > maxVal[i] ) { maxVal[i] = c; maxVert[i] = v; }
            }
        }

        /* Find two vertices separated by at least 1/sqrt(3) of the maximum
        * distance between any two vertices
        */
        i = 0;
        if( maxVal[1] - minVal[1] > maxVal[0] - minVal[0] ) { i = 1; }
        if( maxVal[2] - minVal[2] > maxVal[i] - minVal[i] ) { i = 2; }
        if( minVal[i] >= maxVal[i] ) {
            /* All vertices are the same -- normal doesn't matter */
            norm[0] = 0; norm[1] = 0; norm[2] = 1;
            return;
        }

        /* Look for a third vertex which forms the triangle with maximum area
        * (Length of normal == twice the triangle area)
        */
        maxLen2 = 0;
        v1 = minVert[i];
        v2 = maxVert[i];
        d1[0] = v1.coords[0] - v2.coords[0];
        d1[1] = v1.coords[1] - v2.coords[1];
        d1[2] = v1.coords[2] - v2.coords[2];
        for( v = vHead.next; v !== vHead; v = v!.next ) {
            d2[0] = v!.coords[0] - v2.coords[0];
            d2[1] = v!.coords[1] - v2.coords[1];
            d2[2] = v!.coords[2] - v2.coords[2];
            tNorm[0] = d1[1]*d2[2] - d1[2]*d2[1];
            tNorm[1] = d1[2]*d2[0] - d1[0]*d2[2];
            tNorm[2] = d1[0]*d2[1] - d1[1]*d2[0];
            tLen2 = tNorm[0]*tNorm[0] + tNorm[1]*tNorm[1] + tNorm[2]*tNorm[2];
            if( tLen2 > maxLen2 ) {
                maxLen2 = tLen2;
                norm[0] = tNorm[0];
                norm[1] = tNorm[1];
                norm[2] = tNorm[2];
            }
        }

        if( maxLen2 <= 0 ) {
            /* All points lie on a single line -- any decent normal will do */
            norm[0] = norm[1] = norm[2] = 0;
            norm[this.longAxis_(d1)] = 1;
        }
    }

    private checkOrientation_() {
        var area;
        var f, fHead = this.mesh!.fHead;
        var v, vHead = this.mesh!.vHead;
        var e;

        /* When we compute the normal automatically, we choose the orientation
        * so that the the sum of the signed areas of all contours is non-negative.
        */
        area = 0;
        for( f = fHead.next; f !== fHead; f = f!.next ) {
            e = f!.anEdge;
            if( e!.winding <= 0 ) continue;
            do {
                area += (e!.Org!.s - e!.Dst!.s) * (e!.Org!.t + e!.Dst!.t);
                e = e!.Lnext;
            } while( e !== f!.anEdge );
        }
        if( area < 0 ) {
            /* Reverse the orientation by flipping all the t-coordinates */
            for( v = vHead.next; v !== vHead; v = v!.next ) {
                v!.t = - v!.t;
            }
            this.tUnit[0] = - this.tUnit[0];
            this.tUnit[1] = - this.tUnit[1];
            this.tUnit[2] = - this.tUnit[2];
        }
    }

/*	#ifdef FOR_TRITE_TEST_PROGRAM
    #include <stdlib.h>
    extern int RandomSweep;
    #define S_UNIT_X	(RandomSweep ? (2*drand48()-1) : 1.0)
    #define S_UNIT_Y	(RandomSweep ? (2*drand48()-1) : 0.0)
    #else
    #if defined(SLANTED_SWEEP) */
    /* The "feature merging" is not intended to be complete.  There are
    * special cases where edges are nearly parallel to the sweep line
    * which are not implemented.  The algorithm should still behave
    * robustly (ie. produce a reasonable tesselation) in the presence
    * of such edges, however it may miss features which could have been
    * merged.  We could minimize this effect by choosing the sweep line
    * direction to be something unusual (ie. not parallel to one of the
    * coordinate axes).
    */
/*	#define S_UNIT_X	(TESSreal)0.50941539564955385	// Pre-normalized
    #define S_UNIT_Y	(TESSreal)0.86052074622010633
    #else
    #define S_UNIT_X	(TESSreal)1.0
    #define S_UNIT_Y	(TESSreal)0.0
    #endif
    #endif*/

    /* Determine the polygon normal and project vertices onto the plane
    * of the polygon.
    */
    private projectPolygon_() {
        var v, vHead = this.mesh!.vHead;
        var norm = [0,0,0];
        var sUnit, tUnit;
        var i, first, computedNormal = false;

        norm[0] = this.normal[0];
        norm[1] = this.normal[1];
        norm[2] = this.normal[2];
        if( norm[0] === 0.0 && norm[1] === 0.0 && norm[2] === 0.0 ) {
            this.computeNormal_( norm );
            computedNormal = true;
        }
        sUnit = this.sUnit;
        tUnit = this.tUnit;
        i = this.longAxis_( norm );

/*	#if defined(FOR_TRITE_TEST_PROGRAM) || defined(TRUE_PROJECT)
        // Choose the initial sUnit vector to be approximately perpendicular
        // to the normal.
        
        Normalize( norm );

        sUnit[i] = 0;
        sUnit[(i+1)%3] = S_UNIT_X;
        sUnit[(i+2)%3] = S_UNIT_Y;

        // Now make it exactly perpendicular 
        w = Dot( sUnit, norm );
        sUnit[0] -= w * norm[0];
        sUnit[1] -= w * norm[1];
        sUnit[2] -= w * norm[2];
        Normalize( sUnit );

        // Choose tUnit so that (sUnit,tUnit,norm) form a right-handed frame 
        tUnit[0] = norm[1]*sUnit[2] - norm[2]*sUnit[1];
        tUnit[1] = norm[2]*sUnit[0] - norm[0]*sUnit[2];
        tUnit[2] = norm[0]*sUnit[1] - norm[1]*sUnit[0];
        Normalize( tUnit );
    #else*/
        /* Project perpendicular to a coordinate axis -- better numerically */
        sUnit[i] = 0;
        sUnit[(i+1)%3] = 1.0;
        sUnit[(i+2)%3] = 0.0;

        tUnit[i] = 0;
        tUnit[(i+1)%3] = 0.0;
        tUnit[(i+2)%3] = (norm[i] > 0) ? 1.0 : -1.0;
//	#endif

        /* Project the vertices onto the sweep plane */
        for( v = vHead.next; v !== vHead; v = v!.next ) {
            v!.s = this.dot_( v!.coords, sUnit );
            v!.t = this.dot_( v!.coords, tUnit );
        }
        if( computedNormal ) {
            this.checkOrientation_();
        }

        /* Compute ST bounds. */
        first = true;
        for( v = vHead.next; v !== vHead; v = v!.next ) {
            if (first) {
                this.bmin[0] = this.bmax[0] = v!.s;
                this.bmin[1] = this.bmax[1] = v!.t;
                first = false;
            } else {
                if (v!.s < this.bmin[0]) this.bmin[0] = v!.s;
                if (v!.s > this.bmax[0]) this.bmax[0] = v!.s;
                if (v!.t < this.bmin[1]) this.bmin[1] = v!.t;
                if (v!.t > this.bmax[1]) this.bmax[1] = v!.t;
            }
        }
    }

    private addWinding_(eDst: TESShalfEdge, eSrc: TESShalfEdge ) {
        eDst.winding += eSrc.winding;
        eDst.Sym!.winding += eSrc.Sym!.winding;
    }
    
    /* tessMeshTessellateMonoRegion( face ) tessellates a monotone region
    * (what else would it do??)  The region must consist of a single
    * loop of half-edges (see mesh.h) oriented CCW.  "Monotone" in this
    * case means that any vertical line intersects the interior of the
    * region in a single interval.  
    *
    * Tessellation consists of adding interior edges (actually pairs of
    * half-edges), to split the region into non-overlapping triangles.
    *
    * The basic idea is explained in Preparata and Shamos (which I don''t
    * have handy right now), although their implementation is more
    * complicated than this one.  The are two edge chains, an upper chain
    * and a lower chain.  We process all vertices from both chains in order,
    * from right to left.
    *
    * The algorithm ensures that the following invariant holds after each
    * vertex is processed: the untessellated region consists of two
    * chains, where one chain (say the upper) is a single edge, and
    * the other chain is concave.  The left vertex of the single edge
    * is always to the left of all vertices in the concave chain.
    *
    * Each step consists of adding the rightmost unprocessed vertex to one
    * of the two chains, and forming a fan of triangles from the rightmost
    * of two chain endpoints.  Determining whether we can add each triangle
    * to the fan is a simple orientation test.  By making the fan as large
    * as possible, we restore the invariant (check it yourself).
    */
//	int tessMeshTessellateMonoRegion( TESSmesh *mesh, TESSface *face )
    private tessellateMonoRegion_( mesh: TESSmesh, face: TESSface ) {
        var up, lo;

        /* All edges are oriented CCW around the boundary of the region.
        * First, find the half-edge whose origin vertex is rightmost.
        * Since the sweep goes from left to right, face->anEdge should
        * be close to the edge we want.
        */
        up = face.anEdge;
        assert( up!.Lnext !== up && up!.Lnext!.Lnext !== up );

        for( ; Geom.vertLeq( up!.Dst!, up!.Org! ); up = up!.Lprev )
            ;
        for( ; Geom.vertLeq( up!.Org!, up!.Dst! ); up = up!.Lnext )
            ;
        lo = up!.Lprev;

        while( up!.Lnext !== lo ) {
            if( Geom.vertLeq( up!.Dst!, lo!.Org! )) {
                /* up->Dst is on the left.  It is safe to form triangles from lo->Org.
                * The EdgeGoesLeft test guarantees progress even when some triangles
                * are CW, given that the upper and lower chains are truly monotone.
                */
                while( lo!.Lnext !== up && (Geom.edgeGoesLeft( lo!.Lnext! )
                    || Geom.edgeSign( lo!.Org!, lo!.Dst!, lo!.Lnext!.Dst! ) <= 0.0 )) {
                        var tempHalfEdge = mesh.connect( lo!.Lnext!, lo! );
                        //if (tempHalfEdge == NULL) return 0;
                        lo = tempHalfEdge.Sym;
                }
                lo = lo!.Lprev;
            } else {
                /* lo->Org is on the left.  We can make CCW triangles from up->Dst. */
                while( lo!.Lnext != up && (Geom.edgeGoesRight( up!.Lprev! )
                    || Geom.edgeSign( up!.Dst!, up!.Org!, up!.Lprev!.Org! ) >= 0.0 )) {
                        var tempHalfEdge = mesh.connect( up!, up!.Lprev! );
                        //if (tempHalfEdge == NULL) return 0;
                        up = tempHalfEdge.Sym;
                }
                up = up!.Lnext;
            }
        }

        /* Now lo->Org == up->Dst == the leftmost vertex.  The remaining region
        * can be tessellated in a fan from this leftmost vertex.
        */
        assert( lo!.Lnext !== up );
        while( lo!.Lnext!.Lnext !== up ) {
            var tempHalfEdge = mesh.connect( lo!.Lnext!, lo! );
            //if (tempHalfEdge == NULL) return 0;
            lo = tempHalfEdge.Sym;
        }

        return true;
    }


    /* tessMeshTessellateInterior( mesh ) tessellates each region of
    * the mesh which is marked "inside" the polygon.  Each such region
    * must be monotone.
    */
    //int tessMeshTessellateInterior( TESSmesh *mesh )
    private tessellateInterior_( mesh: TESSmesh ) {
        var f, next;

        /*LINTED*/
        for( f = mesh.fHead.next; f !== mesh.fHead; f = next ) {
            /* Make sure we don''t try to tessellate the new triangles. */
            next = f!.next;
            if( f!.inside ) {
                if ( !this.tessellateMonoRegion_( mesh, f! ) ) return false;
            }
        }

        return true;
    }


    /* tessMeshDiscardExterior( mesh ) zaps (ie. sets to NULL) all faces
    * which are not marked "inside" the polygon.  Since further mesh operations
    * on NULL faces are not allowed, the main purpose is to clean up the
    * mesh so that exterior loops are not represented in the data structure.
    */
    //void tessMeshDiscardExterior( TESSmesh *mesh )
    private discardExterior_( mesh: TESSmesh ) {
        var f, next;

        /*LINTED*/
        for( f = mesh.fHead.next; f !== mesh.fHead; f = next ) {
            /* Since f will be destroyed, save its next pointer. */
            next = f!.next;
            if( ! f!.inside ) {
                mesh.zapFace( f! );
            }
        }
    }

    /* tessMeshSetWindingNumber( mesh, value, keepOnlyBoundary ) resets the
    * winding numbers on all edges so that regions marked "inside" the
    * polygon have a winding number of "value", and regions outside
    * have a winding number of 0.
    *
    * If keepOnlyBoundary is TRUE, it also deletes all edges which do not
    * separate an interior region from an exterior one.
    */
//	int tessMeshSetWindingNumber( TESSmesh *mesh, int value, int keepOnlyBoundary )
    private setWindingNumber_( mesh: TESSmesh, value: number, keepOnlyBoundary: boolean ) {
        var e, eNext;

        for( e = mesh.eHead.next; e !== mesh.eHead; e = eNext ) {
            eNext = e!.next;
            if( e!.Rface!.inside !== e!.Lface!.inside ) {

                /* This is a boundary edge (one side is interior, one is exterior). */
                e!.winding = (e!.Lface!.inside) ? value : -value;
            } else {

                /* Both regions are interior, or both are exterior. */
                if( ! keepOnlyBoundary ) {
                    e!.winding = 0;
                } else {
                    mesh.delete( e! );
                }
            }
        }
    }

    private getNeighbourFace_(edge: TESShalfEdge)
    {
        if (!edge.Rface)
            return -1;
        if (!edge.Rface.inside)
            return -1;
        return edge.Rface.n;
    }

    private outputPolymesh_( mesh: TESSmesh, elementType: Tess2, polySize: number, vertexSize: number ) {
        var v;
        var f;
        var edge;
        var maxFaceCount = 0;
        var maxVertexCount = 0;
        var faceVerts, i;
        var elements = 0;
        var vert;

        // Assume that the input data is triangles now.
        // Try to merge as many polygons as possible
        if (polySize > 3)
        {
            mesh.mergeConvexFaces( polySize );
        }

        // Mark unused
        for ( v = mesh.vHead.next; v !== mesh.vHead; v = v!.next )
            v!.n = -1;

        // Create unique IDs for all vertices and faces.
        for ( f = mesh.fHead.next; f != mesh.fHead; f = f!.next )
        {
            f!.n = -1;
            if( !f!.inside ) continue;

            edge = f!.anEdge;
            faceVerts = 0;
            do
            {
                v = edge!.Org;
                if ( v!.n === -1 )
                {
                    v!.n = maxVertexCount;
                    maxVertexCount++;
                }
                faceVerts++;
                edge = edge!.Lnext;
            }
            while (edge !== f!.anEdge);
            
            assert( faceVerts <= polySize );

            f!.n = maxFaceCount;
            ++maxFaceCount;
        }

        this.elementCount = maxFaceCount;
        if (elementType == Tess2.CONNECTED_POLYGONS)
            maxFaceCount *= 2;
/*		tess.elements = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
                                                          sizeof(TESSindex) * maxFaceCount * polySize );
        if (!tess->elements)
        {
            tess->outOfMemory = 1;
            return;
        }*/
        this.elements = [];
        this.elements.length = maxFaceCount * polySize;
        
        this.vertexCount = maxVertexCount;
/*		tess->vertices = (TESSreal*)tess->alloc.memalloc( tess->alloc.userData,
                                                         sizeof(TESSreal) * tess->vertexCount * vertexSize );
        if (!tess->vertices)
        {
            tess->outOfMemory = 1;
            return;
        }*/
        this.vertices = [];
        this.vertices.length = maxVertexCount * vertexSize;

/*		tess->vertexIndices = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
                                                                sizeof(TESSindex) * tess->vertexCount );
        if (!tess->vertexIndices)
        {
            tess->outOfMemory = 1;
            return;
        }*/
        this.vertexIndices = [];
        this.vertexIndices.length = maxVertexCount;

        
        // Output vertices.
        for ( v = mesh.vHead.next; v !== mesh.vHead; v = v!.next )
        {
            if ( v!.n != -1 )
            {
                // Store coordinate
                var idx = v!.n * vertexSize;
                this.vertices[idx+0] = v!.coords[0];
                this.vertices[idx+1] = v!.coords[1];
                if ( vertexSize > 2 )
                    this.vertices[idx+2] = v!.coords[2];
                // Store vertex index.
                this.vertexIndices[v!.n] = v!.idx;
            }
        }

        // Output indices.
        var nel = 0;
        for ( f = mesh.fHead.next; f !== mesh.fHead; f = f!.next )
        {
            if ( !f!.inside ) continue;
            
            // Store polygon
            edge = f!.anEdge;
            faceVerts = 0;
            do
            {
                v = edge!.Org;
                this.elements[nel++] = v!.n;
                faceVerts++;
                edge = edge!.Lnext;
            }
            while (edge !== f!.anEdge);
            // Fill unused.
            for (i = faceVerts; i < polySize; ++i)
                this.elements[nel++] = -1;

            // Store polygon connectivity
            if ( elementType == Tess2.CONNECTED_POLYGONS )
            {
                edge = f!.anEdge;
                do
                {
                    this.elements[nel++] = this.getNeighbourFace_( edge! );
                    edge = edge!.Lnext;
                }
                while (edge !== f!.anEdge);
                // Fill unused.
                for (i = faceVerts; i < polySize; ++i)
                    this.elements[nel++] = -1;
            }
        }
    }

//	void OutputContours( TESStesselator *tess, TESSmesh *mesh, int vertexSize )
    private outputContours_( mesh: TESSmesh, vertexSize: number ) {
        var f;
        var edge;
        var start;
        var verts;
        var elements;
        var vertInds;
        var startVert = 0;
        var vertCount = 0;

        this.vertexCount = 0;
        this.elementCount = 0;

        for ( f = mesh.fHead.next; f !== mesh.fHead; f = f!.next )
        {
            if ( !f!.inside ) continue;

            start = edge = f!.anEdge;
            do
            {
                this.vertexCount++;
                edge = edge!.Lnext;
            }
            while ( edge !== start );

            this.elementCount++;
        }

/*		tess->elements = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
                                                          sizeof(TESSindex) * tess->elementCount * 2 );
        if (!tess->elements)
        {
            tess->outOfMemory = 1;
            return;
        }*/
        this.elements = [];
        this.elements.length = this.elementCount * 2;
        
/*		tess->vertices = (TESSreal*)tess->alloc.memalloc( tess->alloc.userData,
                                                          sizeof(TESSreal) * tess->vertexCount * vertexSize );
        if (!tess->vertices)
        {
            tess->outOfMemory = 1;
            return;
        }*/
        this.vertices = [];
        this.vertices.length = this.vertexCount * vertexSize;

/*		tess->vertexIndices = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
                                                                sizeof(TESSindex) * tess->vertexCount );
        if (!tess->vertexIndices)
        {
            tess->outOfMemory = 1;
            return;
        }*/
        this.vertexIndices = [];
        this.vertexIndices.length = this.vertexCount;

        var nv = 0;
        var nvi = 0;
        var nel = 0;
        startVert = 0;

        for ( f = mesh.fHead.next; f !== mesh.fHead; f = f!.next )
        {
            if ( !f!.inside ) continue;

            vertCount = 0;
            start = edge = f!.anEdge;
            do
            {
                this.vertices[nv++] = edge!.Org!.coords[0];
                this.vertices[nv++] = edge!.Org!.coords[1];
                if ( vertexSize > 2 )
                    this.vertices[nv++] = edge!.Org!.coords[2];
                this.vertexIndices[nvi++] = edge!.Org!.idx;
                vertCount++;
                edge = edge!.Lnext;
            }
            while ( edge !== start );

            this.elements[nel++] = startVert;
            this.elements[nel++] = vertCount;

            startVert += vertCount;
        }
    }

    public addContour( size: number, vertices: number[] )
    {
        var e;
        var i;

        if ( this.mesh === null )
              this.mesh = new TESSmesh();
/*	 	if ( tess->mesh == NULL ) {
            tess->outOfMemory = 1;
            return;
        }*/

        if ( size < 2 )
            size = 2;
        if ( size > 3 )
            size = 3;

        e = null;

        for( i = 0; i < vertices.length; i += size )
        {
            if( e == null ) {
                /* Make a self-loop (one vertex, one edge). */
                e = this.mesh.makeEdge();
/*				if ( e == NULL ) {
                    tess->outOfMemory = 1;
                    return;
                }*/
                this.mesh.splice( e, e.Sym! );
            } else {
                /* Create a new vertex and edge which immediately follow e
                * in the ordering around the left face.
                */
                this.mesh.splitEdge( e );
                e = e.Lnext;
            }

            /* The new vertex is now e->Org. */
            e!.Org!.coords[0] = vertices[i+0];
            e!.Org!.coords[1] = vertices[i+1];
            if ( size > 2 )
                e!.Org!.coords[2] = vertices[i+2];
            else
                e!.Org!.coords[2] = 0.0;
            /* Store the insertion number so that the vertex can be later recognized. */
            e!.Org!.idx = this.vertexIndexCounter++;

            /* The winding of an edge says how the winding number changes as we
            * cross from the edge''s right face to its left face.  We add the
            * vertices in such an order that a CCW contour will add +1 to
            * the winding number of the region inside the contour.
            */
            e!.winding = 1;
            e!.Sym!.winding = -1;
        }
    }

//	int tessTesselate( TESStesselator *tess, int windingRule, int elementType, int polySize, int vertexSize, const TESSreal* normal )
    public tesselate( windingRule: number, elementType: Tess2, polySize: number, vertexSize: number, normal: number[] ) {
        this.vertices = [];
        this.elements = [];
        this.vertexIndices = [];

        this.vertexIndexCounter = 0;
        
        if (normal)
        {
            this.normal[0] = normal[0];
            this.normal[1] = normal[1];
            this.normal[2] = normal[2];
        }

        this.windingRule = windingRule;

        if (vertexSize < 2)
            vertexSize = 2;
        if (vertexSize > 3)
            vertexSize = 3;

/*		if (setjmp(tess->env) != 0) { 
            // come back here if out of memory
            return 0;
        }*/

        if (!this.mesh)
        {
            return false;
        }

        /* Determine the polygon normal and project vertices onto the plane
        * of the polygon.
        */
        this.projectPolygon_();

        /* tessComputeInterior( tess ) computes the planar arrangement specified
        * by the given contours, and further subdivides this arrangement
        * into regions.  Each region is marked "inside" if it belongs
        * to the polygon, according to the rule given by tess->windingRule.
        * Each interior region is guaranteed be monotone.
        */
        Sweep.computeInterior( this );

        var mesh = this.mesh;

        /* If the user wants only the boundary contours, we throw away all edges
        * except those which separate the interior from the exterior.
        * Otherwise we tessellate all the regions marked "inside".
        */
        if (elementType == Tess2.BOUNDARY_CONTOURS) {
            this.setWindingNumber_( mesh, 1, true );
        } else {
            this.tessellateInterior_( mesh ); 
        }
//		if (rc == 0) longjmp(tess->env,1);  /* could've used a label */

        mesh.check();

        if (elementType == Tess2.BOUNDARY_CONTOURS) {
            this.outputContours_( mesh, vertexSize );     /* output contours */
        }
        else
        {
            this.outputPolymesh_( mesh, elementType, polySize, vertexSize );     /* output polygons */
        }

//			tess.mesh = null;

        return true;
    }
};


	type leqFunction = (u: any, v: any) => boolean;

    export class PriorityQ {
		public size;
		public max;
		public nodes;
		public handles;
		public initialized;
		public freeList;
		public leq: leqFunction;

		constructor(size: number, leq: leqFunction) {
			this.size = 0;
			this.max = size;

			this.nodes = [];
			this.nodes.length = size+1;
			for (var i = 0; i < this.nodes.length; i++)
				this.nodes[i] = new PQnode();

			this.handles = [];
			this.handles.length = size+1;
			for (var i = 0; i < this.handles.length; i++)
				this.handles[i] = new PQhandleElem();

			this.initialized = false;
			this.freeList = 0;
			this.leq = leq;

			this.nodes[1].handle = 1;	/* so that Minimum() returns NULL */
			this.handles[1].key = null;
		}

		floatDown_( curr: number )
		{
			var n = this.nodes;
			var h = this.handles;
			var hCurr, hChild;
			var child;

			hCurr = n[curr].handle;
			for( ;; ) {
				child = curr << 1;
				if( child < this.size && this.leq( h[n[child+1].handle!].key, h[n[child].handle!].key )) {
					++child;
				}

				assert(child <= this.max);

				hChild = n[child].handle;
				if( child > this.size || this.leq( h[hCurr!].key, h[hChild!].key )) {
					n[curr].handle = hCurr;
					h[hCurr!].node = curr;
					break;
				}
				n[curr].handle = hChild;
				h[hChild!].node = curr;
				curr = child;
			}
		}

		floatUp_( curr: number )
		{
			var n = this.nodes;
			var h = this.handles;
			var hCurr, hParent;
			var parent;

			hCurr = n[curr].handle;
			for( ;; ) {
				parent = curr >> 1;
				hParent = n[parent].handle;
				if( parent == 0 || this.leq( h[hParent!].key, h[hCurr!].key )) {
					n[curr].handle = hCurr;
					h[hCurr!].node = curr;
					break;
				}
				n[curr].handle = hParent;
				h[hParent!].node = curr;
				curr = parent;
			}
		}

		init() {
			/* This method of building a heap is O(n), rather than O(n lg n). */
			for( var i = this.size; i >= 1; --i ) {
				this.floatDown_( i );
			}
			this.initialized = true;
		}

		min() {
			return this.handles[this.nodes[1].handle!].key;
		}

		isEmpty() {
			this.size === 0;
		}

		/* really pqHeapInsert */
		/* returns INV_HANDLE iff out of memory */
		//PQhandle pqHeapInsert( TESSalloc* alloc, PriorityQHeap *pq, PQkey keyNew )
		insert(keyNew: TESSvertex)
		{
			var curr;
			var free;

			curr = ++this.size;
			if( (curr*2) > this.max ) {
				this.max *= 2;
				var s;
				s = this.nodes.length;
				this.nodes.length = this.max+1;
				for (var i = s; i < this.nodes.length; i++)
					this.nodes[i] = new PQnode();

				s = this.handles.length;
				this.handles.length = this.max+1;
				for (var i = s; i < this.handles.length; i++)
					this.handles[i] = new PQhandleElem();
			}

			if( this.freeList === 0 ) {
				free = curr;
			} else {
				free = this.freeList;
				this.freeList = this.handles[free].node!;
			}

			this.nodes[curr].handle = free;
			this.handles[free].node = curr;
			this.handles[free].key = keyNew;

			if( this.initialized ) {
				this.floatUp_( curr );
			}
			return free;
		}

		//PQkey pqHeapExtractMin( PriorityQHeap *pq )
		extractMin() {
			var n = this.nodes;
			var h = this.handles;
			var hMin = n[1].handle;
			var min = h[hMin!].key;

			if( this.size > 0 ) {
				n[1].handle = n[this.size].handle;
				h[n[1].handle!].node = 1;

				h[hMin!].key = null;
				h[hMin!].node = this.freeList;
				this.freeList = hMin!;

				--this.size;
				if( this.size > 0 ) {
					this.floatDown_( 1 );
				}
			}
			return min;
		}

		public delete( hCurr: number ) {
			var n = this.nodes;
			var h = this.handles;
			var curr;

			assert( hCurr >= 1 && hCurr <= this.max && h[hCurr].key !== null );

			curr = h[hCurr].node;
			n[curr!].handle = n[this.size].handle;
			h[n[curr!].handle!].node = curr;

			--this.size;
			if( curr! <= this.size ) {
				if( curr! <= 1 || this.leq( h[n[curr!>>1].handle!].key, h[n[curr!].handle!].key )) {
					this.floatDown_( curr! );
				} else {
					this.floatUp_( curr! );
				}
			}
			h[hCurr].key = null;
			h[hCurr].node = this.freeList;
			this.freeList = hCurr;
		}
	};

    class PQnode{

		public handle: number | null;
		constructor() {
			this.handle = null;
		}
	}

    class PQhandleElem{

		public key: TESSvertex | null;
		public node: number | null;

		constructor() {
			this.key = null;
			this.node = null;
		}
	}

    class DictNode {
		public key: ActiveRegion | null;
		public next: DictNode | null;
		public prev: DictNode | null;

		constructor() {
			this.key = null;
			this.next = null;
			this.prev = null;
		}
	};

	type leqFunctionDict = (u: any, v: any, w: any) => boolean;

	export class Dict {

		public head: DictNode | null;
		public frame: Tesselator;
		public leq: leqFunctionDict;

		constructor(frame: Tesselator, leq: leqFunctionDict) {
			this.head = new DictNode();
			this.head.next = this.head;
			this.head.prev = this.head;
			this.frame = frame;
			this.leq = leq;
		}

		min() {
			return this.head!.next;
		}

		max() {
			return this.head!.prev;
		}

		insert(k: ActiveRegion) {
			return this.insertBefore(this.head!, k);
		}

		search(key: ActiveRegion) {
			/* Search returns the node with the smallest key greater than or equal
			* to the given key.  If there is no such key, returns a node whose
			* key is NULL.  Similarly, Succ(Max(d)) has a NULL key, etc.
			*/
			var node = this.head;
			do {
				node = node!.next;
			} while( node!.key !== null && ! this.leq(this.frame, key, node!.key));

			return node;
		}

		insertBefore(node: DictNode, key: ActiveRegion) {
			do {
				node = node.prev!;
			} while( node.key !== null && ! this.leq(this.frame, node.key, key));

			var newNode = new DictNode();
			newNode.key = key;
			newNode.next = node.next;
			node!.next!.prev = newNode;
			newNode.prev = node;
			node.next = newNode;

			return newNode;
		}

		public delete(node: DictNode) {
			node!.next!.prev = node.prev;
			node!.prev!.next = node.next;
		}
	};

    export class ActiveRegion{
		public eUp: TESShalfEdge | null;
		public nodeUp: DictNode | null;
		public windingNumber;
		public inside;
		public sentinel;
		public dirty;
		public fixUpperEdge;


		constructor() {
			this.eUp = null;		/* upper edge, directed right to left */
			this.nodeUp = null;	/* dictionary node corresponding to eUp */
			this.windingNumber = 0;	/* used to determine which regions are
									* inside the polygon */
			this.inside = false;		/* is this region inside the polygon? */
			this.sentinel = false;	/* marks fake edges at t = +/-infinity */
			this.dirty = false;		/* marks regions where the upper or lower
							* edge has changed, but we haven't checked
							* whether they intersect yet */
			this.fixUpperEdge = false;	/* marks temporary edges introduced when
								* we process a "right vertex" (one without
								* any edges leaving to the right) */
		}
	};