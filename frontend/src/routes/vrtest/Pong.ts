import { loadModel, createShape } from "./Model";
import { Entity, createPhysicsObject } from "./Entity";
import { World } from "./World";
import type { Options as WorldOptions } from "./World";
import { Ammo } from "./Ammo";
import { Vector, Quaternion } from "./Math";
import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

async function createLights(world: Pong) {
    const light = new THREE.SpotLight("white", 450, 0, Math.PI * 0.45, 0.0, 2);
    const pointLight = new THREE.PointLight("white", 20, 0, 2);
    const ambient = new THREE.AmbientLight("white", 0.5);
    const hemisphere = new THREE.HemisphereLight(0xffffff, "grey", 1.0);

    light.position.y = 19;
    pointLight.position.y = 4;
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;

	world.scene.add(light);
	world.scene.add(pointLight);
	world.scene.add(ambient);
	world.scene.add(hemisphere);
}

async function createTexture(world: Pong, path: string) {
	const texture = await textureLoader.loadAsync(path);
	texture.anisotropy = 16;
	texture.wrapT = THREE.RepeatWrapping;
	texture.wrapS = THREE.RepeatWrapping;
	texture.repeat = new THREE.Vector2(10, 10);
	return world.addThreeObject(texture);
}

async function createMaterial(world: Pong) {
	const textureMap = await createTexture(world, "/Assets/harshbricks-Unreal-Engine/harshbricks-albedo.png");
	const textureAoMap = await createTexture(world, "/Assets/harshbricks-Unreal-Engine/harshbricks-ao2.png");
	const textureRoughnessMap = await createTexture(world, "/Assets/harshbricks-Unreal-Engine/harshbricks-roughness.png");
	const textureDisplacementMap = await createTexture(world, "/Assets/harshbricks-Unreal-Engine/harshbricks-height5-16.png");
	const textureMetalnessMap = await createTexture(world, "/Assets/harshbricks-Unreal-Engine/harshbricks-metalness.png");
	const textureNormalMap = await createTexture(world, "/Assets/harshbricks-Unreal-Engine/harshbricks-normal.png");

	return world.addThreeObject(new THREE.MeshStandardMaterial({
		map: textureMap,
		side: THREE.DoubleSide,
		aoMap: textureAoMap,
		roughnessMap: textureRoughnessMap,
		metalnessMap: textureMetalnessMap,
		normalMap: textureNormalMap,
		normalScale: new THREE.Vector2(1, 1),
		displacementMap: textureDisplacementMap,
		displacementScale: 0.04,
	}));
}

async function createFloor(world: Pong) {
	const geometry = world.addThreeObject(new THREE.PlaneGeometry(10, 10));
	const material = await createMaterial(world);
	const mesh = new THREE.Mesh(geometry, material);

	mesh.rotation.set(-Math.PI / 2, 0, 0);
	world.scene.add(mesh);
}

export class Table extends Entity {
	static readonly UUID = "6520af0e-f9f2-48ab-9cb1-55a7993043cc";

	public name = "table";
	public dynamic = false;

	public constructor(world: Pong, uuid: string) {
		const shape = createShape(world.tableModel!);
		const physicsObject = createPhysicsObject(shape, 0);

		physicsObject.setRestitution(0.7);
		super(world, uuid, world.tableModel!.clone(), physicsObject);
	}
}

export class Ball extends Entity {
	public static readonly UUID = "a80489ec-3b79-4c97-9bc3-d26f80d76bfb";
	public static readonly RADIUS = 0.02;
	public static readonly MASS = 0.0027;
	public static readonly RESTITUTION = 0.9;

	public name = "ball";
	public dynamic = true;
	private geometry: THREE.SphereGeometry;
	private material: THREE.MeshStandardMaterial;

	public constructor(world: Pong, uuid: string) {
		const geometry = new THREE.SphereGeometry(Ball.RADIUS);
		const material = new THREE.MeshStandardMaterial({ color: "white" });
		const mesh = new THREE.Mesh(geometry, material);
		const shape = new Ammo.btSphereShape(Ball.RADIUS);
		const physicsObject = createPhysicsObject(shape, Ball.MASS);

		physicsObject.setRestitution(Ball.RESTITUTION);
		super(world, uuid, mesh, physicsObject);
		this.geometry = geometry;
		this.material = material;
		mesh.castShadow = true;
	}

	public lateTick() {
		this.rotation = new Quaternion(0, 0, 0, 1);

		super.lateTick();
	}

	public destroy() {
		this.geometry.dispose();
		this.material.dispose();

		super.destroy();
	}

	public onCollision(other: Entity | null, p0: Vector, p1: Vector) {
		console.log("collision", other?.name, p0, p1);
	}
}

export class Paddle extends Entity {
	public static readonly MASS = 0.25;
	public static readonly RESTITUTION = 0.7;
	public static readonly LIFETIME = 60;

	public name = "paddle";
	public dynamic = true;

	public constructor(world: Pong, uuid: string) {
		const shape = createShape(world.paddleModel!);
		const physicsObject = createPhysicsObject(shape, Paddle.MASS);

		physicsObject.setRestitution(Paddle.RESTITUTION);
		super(world, uuid, world.paddleModel!.clone(), physicsObject);
	}

	public earlyTick() {
		if (this.lastUpdate < this.world.time - Paddle.LIFETIME) {
			this.removed = true;
		}

		super.earlyTick();
	}
}

let counter = 201;

export class Pong extends World {
	public paddleUUID: string;
	public rightController: THREE.XRTargetRaySpace;
	public leftController: THREE.XRTargetRaySpace;
	public tableModel?: THREE.Object3D;
	public paddleModel?: THREE.Object3D;

	public constructor() {
		super();
		
		this.paddleUUID = crypto.randomUUID();

		this.rightController = this.renderer.xr.getController(0);
		this.leftController = this.renderer.xr.getController(1);
		this.cameraGroup.add(this.rightController);
		this.cameraGroup.add(this.leftController);

		this.register("ball", object => new Ball(this, object.uuid));
		this.register("paddle", object => new Paddle(this, object.uuid));
	}

	public async init() {
		const paddleTransform = {
			scale: new Vector(0.048, 0.048, 0.048),
			rotate: new Vector(Math.PI / 6 * 4, 0, 0),
			translate: new Vector(0, 0.02, -0.04),
		};

		this.tableModel = await loadModel("./Assets/gltf/pingPongTable/pingPongTable.gltf");
		this.paddleModel = await loadModel("./Assets/gltf/paddle/paddle.gltf", paddleTransform);

		await createLights(this);
		await createFloor(this);

		this.add(new Table(this, Table.UUID));
	}

	public earlyTick() {
		if (this.time >= this.maxTime) {
			this.sendUpdate("paddle", this.paddleUUID, {
				targetPosition: Vector.fromThree(this.rightController.getWorldPosition(this.rightController.position)).intoObject(),
				targetRotation: Quaternion.fromThree(this.rightController.getWorldQuaternion(this.rightController.quaternion)).intoObject(),
			});
		}

		super.earlyTick();

		if (counter++ == 200) {
			console.log(this.get(Ball.UUID)?.position);
		}
	}

	public start(options: WorldOptions) {
		this.rightController.addEventListener("selectstart", () => {
			const paddle = this.get(this.paddleUUID);

			if (paddle !== null) {
				this.sendUpdate("ball", Ball.UUID, {
					position: paddle.position.add(new Vector(0, 0.25, 0)).intoObject(),
					linearVelocity: new Vector(0, 1, 0).intoObject(),
					angularVelocity: new Vector(0, 0, 0).intoObject(),
				});

				counter = 0;
			}
		});

		window.onkeydown = event => {
			const forward = new THREE.Vector3();
			const cross = new THREE.Vector3();
			this.cameraGroup.getWorldDirection(forward);
			cross.crossVectors(forward, new THREE.Vector3(0, 1, 0));

			if (event.key == "q") {
				this.cameraGroup.rotateY(Math.PI / 8);
			} else if (event.key == "e") {
				this.cameraGroup.rotateY(-Math.PI / 8);
			} else if (event.key == "w") {
				this.cameraGroup.position.add(forward.multiplyScalar(-1 / 8));
			} else if (event.key == "s") {
				this.cameraGroup.position.add(forward.multiplyScalar(1 / 8));
			} else if (event.key == "a") {
				this.cameraGroup.position.add(cross.multiplyScalar(1 / 8));
			} else if (event.key == "d") {
				this.cameraGroup.position.add(cross.multiplyScalar(-1 / 8));
			} else if (event.key == "z") {
				this.cameraGroup.position.add(new THREE.Vector3(0, 1 / 8, 0));
			} else if (event.key == "x") {
				this.cameraGroup.position.add(new THREE.Vector3(0, -1 / 8, 0));
			}
		};

		super.start(options);
	}

	public stop() {
		window.onkeydown = null;

		super.stop();
	}
}
