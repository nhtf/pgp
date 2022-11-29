import { ShadowMaterial, PlaneGeometry, Mesh, type Object3D } from "three";
import { Entity } from "../Systems/entity";
import { Quaternion, Vector } from "../Systems/math";
import { createShape } from "../Systems/ModelLoader";
import type { World } from "../Systems/world";
import { tableHeight, tableLength, tableWidth, tableId } from "./vars";

export class Table extends Entity {

    constructor(world: World, mesh: Object3D) {
        const tableShape = createShape(mesh.children[0]);
        mesh.receiveShadow = true;
        super(world, mesh, tableShape, 0, new Vector(0, 0, 0), new Quaternion(0,0,0,1), false);

        this.physicsObject.setRestitution(0.7);
        this.physicsObject.setUserIndex(tableId);
        
    }
}

export function createTableTop() {
    const material = new ShadowMaterial();
    material.opacity = 0.7;
    const tableTop = new Mesh(new PlaneGeometry(tableLength, tableWidth), material);
    tableTop.position.y = tableHeight;
    tableTop.rotateX(- Math.PI / 2);
    tableTop.receiveShadow = true;
    return tableTop;
}
