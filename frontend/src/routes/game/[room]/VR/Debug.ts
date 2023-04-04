import type { World } from "./World";
import { Ammo } from "./Ammo";
import * as THREE from "three";

export class Debug {
	private world: World;
	private index: number;
	private position: Float32Array;
	private color: Float32Array;
	private geometry: THREE.BufferGeometry;
	private material: THREE.LineBasicMaterial;
	private lineSegments: THREE.LineSegments;
	private debugDrawer: Ammo.DebugDrawer;

	public constructor(world: World) {
		this.world = world;
		this.index = 0;

		this.geometry = new THREE.BufferGeometry();
		this.material = new THREE.LineBasicMaterial({ vertexColors: true });
		this.lineSegments = new THREE.LineSegments(this.geometry, this.material);
		
		this.position = new Float32Array(1000000 * 3);
		this.color = new Float32Array(1000000 * 3);
		this.geometry.setAttribute("position", new THREE.BufferAttribute(this.position, 3).setUsage(THREE.DynamicDrawUsage));
		this.geometry.setAttribute("color", new THREE.BufferAttribute(this.color, 3).setUsage(THREE.DynamicDrawUsage));
		this.geometry.setDrawRange(0, 0);

		this.debugDrawer = new Ammo.DebugDrawer();
		this.debugDrawer.drawLine = this.drawLine.bind(this);
		this.debugDrawer.getDebugMode = this.getDebugMode.bind(this);

		world.scene.add(this.lineSegments);
		world.world.setDebugDrawer(this.debugDrawer);
	}

	private drawLine(from: any, to: any, color: any) {
		this.position[this.index * 3 + 0] = (Ammo as any).HEAPF32[from / 4 + 0];
		this.position[this.index * 3 + 1] = (Ammo as any).HEAPF32[from / 4 + 1];
		this.position[this.index * 3 + 2] = (Ammo as any).HEAPF32[from / 4 + 2];
		this.position[this.index * 3 + 3] = (Ammo as any).HEAPF32[to / 4 + 0];
		this.position[this.index * 3 + 4] = (Ammo as any).HEAPF32[to / 4 + 1];
		this.position[this.index * 3 + 5] = (Ammo as any).HEAPF32[to / 4 + 2];

		this.color[this.index * 3 + 0] = (Ammo as any).HEAPF32[color / 4 + 0];
		this.color[this.index * 3 + 1] = (Ammo as any).HEAPF32[color / 4 + 1];
		this.color[this.index * 3 + 2] = (Ammo as any).HEAPF32[color / 4 + 2];
		this.color[this.index * 3 + 3] = (Ammo as any).HEAPF32[color / 4 + 0];
		this.color[this.index * 3 + 4] = (Ammo as any).HEAPF32[color / 4 + 1];
		this.color[this.index * 3 + 5] = (Ammo as any).HEAPF32[color / 4 + 2];

		this.index += 2;
	}

	private getDebugMode() {
		return 1;
	}

	public update() {
		this.world.world.debugDrawWorld();
		this.geometry.attributes.position.needsUpdate = true;
		this.geometry.attributes.color.needsUpdate = true;
		this.geometry.setDrawRange(0, this.index);
		this.index = 0;
	}
}
