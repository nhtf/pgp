import { loadModel, createShape } from "./Model";
import { Entity, createPhysicsObject } from "./Entity";
import { World } from "./World";
import type { Options as WorldOptions } from "./World";
import { Ammo } from "./Ammo";
import { Vector, Quaternion } from "./Math";
import * as THREE from "three";

function createLights(world: Pong) {
    const light = new THREE.SpotLight("white", 450, 0, Math.PI * 0.45, 0.0, 2);
    const pointLight = new THREE.PointLight("white", 50, 0, 2);
    const ambient = new THREE.AmbientLight("white", 0.5);
    const hemisphere = new THREE.HemisphereLight(0xffffff, "grey", 1.0);

    light.position.y = 19;
    pointLight.position.y = 4;
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 2048;
    pointLight.shadow.mapSize.height = 2048;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 20;

	world.scene.add(light);
	world.scene.add(pointLight);
	world.scene.add(ambient);
	world.scene.add(hemisphere);
}

function createTable(world: Pong, tableModel: THREE.Object3D) {
	const shape = createShape(tableModel);
	const physicsObject = createPhysicsObject(shape, 0);

	physicsObject.setRestitution(0.7);
	world.scene.add(tableModel);
	world.world.addRigidBody(physicsObject);
}

export class Ball extends Entity {
	public static readonly UUID = "a80489ec-3b79-4c97-9bc3-d26f80d76bfb";
	public static readonly NAME = "ball";
	public static readonly RADIUS = 0.02;
	public static readonly MASS = 0.0027;
	public static readonly RESTITUTION = 0.9;

	public constructor(uuid: string) {
		const geometry = new THREE.SphereGeometry(Ball.RADIUS);
		const material = new THREE.MeshStandardMaterial({ color: "white" });
		const mesh = new THREE.Mesh(geometry, material);
		const shape = new Ammo.btSphereShape(Ball.RADIUS);
		const physicsObject = createPhysicsObject(shape, Ball.MASS);

		physicsObject.setRestitution(Ball.RESTITUTION);
		super(uuid, Ball.NAME, mesh, physicsObject);
	}
}

export class Paddle extends Entity {
	public static readonly NAME = "paddle";
	public static readonly MASS = 0.25;
	public static readonly RESTITUTION = 0.7;

	public constructor(uuid: string, mesh: THREE.Object3D) {
		const shape = createShape(mesh);
		const physicsObject = createPhysicsObject(shape, Paddle.MASS);

		physicsObject.setRestitution(Paddle.RESTITUTION);
		super(uuid, Paddle.NAME, mesh.clone(), physicsObject);
	}
}

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

		this.register(Ball.NAME, object => new Ball(object.uuid));
		this.register(Paddle.NAME, object => new Paddle(object.uuid, this.paddleModel!));
	}

	public async init() {
		const paddleTransform = {
			scale: new Vector(0.048, 0.048, 0.048),
			rotate: new Vector(Math.PI / 6 * 4, 0, 0),
			translate: new Vector(0, 0.02, -0.04),
		};

		this.tableModel = await loadModel("./Assets/gltf/pingPongTable/pingPongTable.gltf");
		this.paddleModel = await loadModel("./Assets/gltf/newPingPong/newPingPong.gltf", paddleTransform);

		createLights(this);
		createTable(this, this.tableModel);
	}

	public earlyTick() {
		if (this.time >= this.targetTime && this.time >= this.maxTime) {
			this.sendUpdate("paddle", this.paddleUUID, {
				targetPosition: Vector.fromThree(this.rightController.getWorldPosition(this.rightController.position)),
				targetRotation: Quaternion.fromThree(this.rightController.getWorldQuaternion(this.rightController.quaternion)),
			});
		}

		super.earlyTick();
	}

	public start(options: WorldOptions) {
		this.rightController.addEventListener("selectstart", () => {
			const paddle = this.get(this.paddleUUID);

			if (paddle !== null) {
				this.sendUpdate("ball", Ball.UUID, {
					position: paddle.position.add(new Vector(0, 0.25, 0)),
					linearVelocity: new Vector(0, 2, 0),
					angularVelocity: new Vector(0, 0, 0),
				});
			}
		});

		super.start(options);
	}
}
