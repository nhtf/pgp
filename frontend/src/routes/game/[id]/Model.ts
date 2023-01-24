import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { Ammo } from "./Ammo";
import { Vector } from "./Math";
import * as THREE from "three";

export interface ModelOptions {
	translate?: Vector,
	rotate?: Vector,
	scale?: Vector,
}

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/examples/jsm/libs/draco");
loader.setDRACOLoader(dracoLoader);

function patch(scene: THREE.Group) {
	scene.traverse(obj => {
		obj.castShadow = true;
		obj.receiveShadow = true;

		if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial && obj.material.map !== null) {
			obj.material.map.anisotropy = 8;
		}
	});
}

export async function loadModel(path: string, options: ModelOptions | null = null): Promise<THREE.Object3D> {
	const gltf = await loader.loadAsync(path);
	patch(gltf.scene);

	if (options !== null) {
		const matrix = new THREE.Matrix4();
		const scale = options.scale ?? new Vector(1, 1, 1);
		const rotate = options.rotate ?? new Vector(0, 0, 0);
		const translate = options.translate ?? new Vector(0, 0, 0);
		matrix.makeScale(scale.x, scale.y, scale.z);
		gltf.scene.applyMatrix4(matrix);
		matrix.makeRotationFromEuler(new THREE.Euler(rotate.x, rotate.y, rotate.z));;
		gltf.scene.applyMatrix4(matrix);
		matrix.makeTranslation(translate.x, translate.y, translate.z);
		gltf.scene.applyMatrix4(matrix);
	}

	const root = new THREE.Group();
	root.add(gltf.scene);
	return root;
}

function addTriangles(mesh: Ammo.btTriangleMesh, obj: THREE.Object3D, transform: THREE.Matrix4) {
	obj.updateMatrix();
	transform = new THREE.Matrix4().multiplyMatrices(transform, obj.matrix);

	if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BufferGeometry) {
		const geometry = obj.geometry.toNonIndexed();
		const vertices = geometry.getAttribute("position").array;

		for (let i = 0; i < vertices.length; i += 9) {
			const a = Vector.fromThree(new THREE.Vector3(vertices[i + 0], vertices[i + 1], vertices[i + 2]).applyMatrix4(transform));
			const b = Vector.fromThree(new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]).applyMatrix4(transform));
			const c = Vector.fromThree(new THREE.Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]).applyMatrix4(transform));
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

export function createShape(obj: THREE.Object3D): Ammo.btBvhTriangleMeshShape {
	const mesh = new Ammo.btTriangleMesh();
	addTriangles(mesh, obj, new THREE.Matrix4().identity());
	return new Ammo.btBvhTriangleMeshShape(mesh, true);
}
