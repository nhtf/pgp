import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import type { Object3D } from 'three';
import { Mesh, BufferGeometry, Vector3 } from 'three';
import { Ammo } from './ammo';
import { Vector } from './math';

const glLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/examples/jsm/libs/draco');
glLoader.setDRACOLoader(dracoLoader);

export async function loadModel(path: string, scale: number): Promise<Object3D | undefined> {
	const gltf = await glLoader.loadAsync(path, function(xhr) {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	});
	const scaleVector = gltf.scene.children[0].scale;
	gltf.scene.children[0].scale.set(scaleVector.x * scale, scaleVector.y * scale, scaleVector.z * scale);
    gltf.scene.children[0].rotation.set(-Math.PI / 3, 0, 0);
	const translation = 0.02;
	gltf.scene.children[0].position.set(0, 0.5 * translation, -0.866 * translation);
	return gltf.scene;
}

function addTriangles(mesh: Ammo.btTriangleMesh, obj: Object3D) {
	if (obj instanceof Mesh && obj.geometry instanceof BufferGeometry) {
		const vertices = obj.geometry.getAttribute("position").array;

		for (let i = 0; i < vertices.length; i += 9) {
			const a = Vector.fromThree(obj.localToWorld(new Vector3(vertices[0], vertices[1], vertices[2])));
			const b = Vector.fromThree(obj.localToWorld(new Vector3(vertices[3], vertices[4], vertices[5])));
			const c = Vector.fromThree(obj.localToWorld(new Vector3(vertices[6], vertices[7], vertices[8])));
			console.log(a, b, c);
			const ammoA = a.intoAmmo(), ammoB = b.intoAmmo(), ammoC = c.intoAmmo();
			mesh.addTriangle(ammoA, ammoB, ammoC, true);
			Ammo.destroy(ammoA);
			Ammo.destroy(ammoB);
			Ammo.destroy(ammoC);
		}
	}

	for (let child of obj.children) {
		addTriangles(mesh, child);
	}
}

export function createShape(obj: Object3D): Ammo.btBvhTriangleMeshShape {
	const mesh = new Ammo.btTriangleMesh();
	// addTriangles(mesh, obj);
	return new Ammo.btBvhTriangleMeshShape(mesh, true);
}
