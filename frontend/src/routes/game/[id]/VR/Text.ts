import { FontLoader, Font } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as THREE from "three";
import type { World } from "./World";
import type { BufferAttribute } from "three";

const loader = new FontLoader();

export async function loadFont(path: string): Promise<Font> {
	return await loader.loadAsync(path);
}

export const HELVETIKER_CLASSIC = await loadFont("/Assets/fonts/helvetiker_regular.typeface.json");
export const PIXELED = await loadFont("/Assets/fonts/Pixeled_Regular.json");

export function createText(text: string, font: Font): TextGeometry {
	return new TextGeometry(text, {
		font: font,
		size: 0.05,
		height: 0.01,
		curveSegments: 12,
	});
}

export class DynamicText {
	private lastText: string;
	private world: World;
	public mesh: THREE.Mesh;

	public constructor(world: World, material: THREE.Material, text: string) {
		this.world = world;

		const geometry = this.world.addThreeObject(createText(text, HELVETIKER_CLASSIC));

		//This is for making the vertices needed to draw text in webgl for modern, temp function
		// const numbersVertices = [];
		// const edgeVertices = [];
		// for (let i = 0; i < 10; i+=1) {
		// 	const test = new TextGeometry(i.toString(), {
		// 		font: PIXELED,
		// 		size: 12
		// 	});
		// 	const edge = new THREE.EdgesGeometry(test);
		// 	const posEdge = edge.attributes.position as BufferAttribute;
		// 	const pos = test.attributes.position as BufferAttribute;
		// 	const vertices = [];
		// 	const vertEdge = [];
		// 	for (let i = 0; i < pos.array.length;) {
		// 		vertices.push(pos.array[i]);
		// 		vertices.push(pos.array[i + 1]);
		// 		i+=3;
		// 	}
		// 	for (let i = 0; i < posEdge.array.length;) {
		// 		vertEdge.push(posEdge.array[i]);
		// 		vertEdge.push(posEdge.array[i + 1]);
		// 		i+=3;
		// 	}
		// 	numbersVertices.push(vertices);
		// 	edgeVertices.push(vertEdge);
		// }
		// console.log("numbers: ", ": ", numbersVertices);
		// console.log("edges: ", edgeVertices);
		

		this.lastText = text;
		this.mesh = new THREE.Mesh(geometry, material);
		this.world.scene.add(this.mesh);
	}

	public set text(text: string) {
		if (this.lastText !== text) {
			const geometry = this.world.addThreeObject(createText(text, HELVETIKER_CLASSIC));
			const oldMesh = this.mesh;

			this.lastText = text;
			this.world.removeThreeObject(this.mesh.geometry);
			this.world.scene.remove(this.mesh);
			this.mesh = new THREE.Mesh(geometry, oldMesh.material);
			this.mesh.applyMatrix4(oldMesh.matrixWorld);
			this.mesh.userData = oldMesh.userData;
			this.mesh.name = oldMesh.name;
			this.world.scene.add(this.mesh);
		}
	}
}
