import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import type { Object3D } from 'three';
import { Mesh, BufferGeometry, Vector3, Matrix4 } from 'three';
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
	gltf.scene.children[0].applyMatrix4(new Matrix4().makeScale(scale, scale, scale));
	gltf.scene.children[0].applyMatrix4(new Matrix4().makeRotationX(Math.PI / 6 + Math.PI / 2));
	gltf.scene.children[0].applyMatrix4(new Matrix4().makeTranslation(0, 0.02, -0.04));
	return gltf.scene;
}

function addTriangles(mesh: Ammo.btTriangleMesh, obj: Object3D, transform: Matrix4) {
	transform = new Matrix4().multiplyMatrices(transform, obj.matrix);

	if (obj instanceof Mesh && obj.geometry instanceof BufferGeometry) {
		const geometry = obj.geometry.toNonIndexed();
		const vertices = geometry.getAttribute("position").array;

		for (let i = 0; i < vertices.length; i += 9) {
			const a = Vector.fromThree(new Vector3(vertices[i + 0], vertices[i + 1], vertices[i + 2]).applyMatrix4(transform));
			const b = Vector.fromThree(new Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]).applyMatrix4(transform));
			const c = Vector.fromThree(new Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]).applyMatrix4(transform));
			const ammoA = a.intoAmmo(), ammoB = b.intoAmmo(), ammoC = c.intoAmmo();
			mesh.addTriangle(ammoA, ammoB, ammoC, true);
			Ammo.destroy(ammoA);
			Ammo.destroy(ammoB);
			Ammo.destroy(ammoC);
		}

		geometry.dispose();
	}

	for (let child of obj.children) {
		addTriangles(mesh, child, transform);
	}
}

export function createShape(obj: Object3D): Ammo.btBvhTriangleMeshShape {
	const mesh = new Ammo.btTriangleMesh();
	addTriangles(mesh, obj, new Matrix4().identity());
	console.debug("converted threejs mesh to ammojs");
	return new Ammo.btBvhTriangleMeshShape(mesh, true);
}
