import { FontLoader, Font } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as THREE from "three";
import type { World } from "./World";

const loader = new FontLoader();

export async function loadFont(): Promise<Font> {
	return await loader.loadAsync("/Assets/fonts/helvetiker_regular.typeface.json");
}

export const HELVETIKER_REGULAR = await loadFont();

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

		const geometry = this.world.addThreeObject(createText(text, HELVETIKER_REGULAR));

		this.lastText = text;
		this.mesh = new THREE.Mesh(geometry, material);
		this.world.scene.add(this.mesh);
	}

	public set text(text: string) {
		if (this.lastText !== text) {
			const geometry = this.world.addThreeObject(createText(text, HELVETIKER_REGULAR));
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