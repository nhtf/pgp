import { loadModel, createShape } from "./Model";
import { DynamicText } from "./Text";
import { Entity, createPhysicsObject } from "./Entity";
import type { EntityObject } from "./Entity";
import { World, TICKS_PER_SECOND } from "./World";
import type { Options as WorldOptions, Snapshot as WorldSnapshot, CreateEvent } from "./World";
import { State, Player } from "./State";
import type { Snapshot as StateSnapshot } from "./State";
import { Ammo } from "./Ammo";
import { Vector, Quaternion } from "../Math";
import { randomHex } from "../Util";
import type { Event as NetEvent } from "../Net";
import * as THREE from "three";

import { get } from "$lib/Web";
import { unwrap } from "$lib/Alert";
import type { User } from "$lib/types";

export interface Snapshot extends WorldSnapshot {
	state: StateSnapshot;
}

export interface PaddleObject extends EntityObject {
	userID: number;
}

export interface BallEvent extends NetEvent {
	paddle: string;
}

export interface Options extends WorldOptions {
	user: User;
}

export type PaddleUpdate = Partial<PaddleObject>;

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

async function createScoreboard(world: Pong) {
	const material = world.addThreeObject(new THREE.MeshBasicMaterial({ color: 0xff0000 }));

	{
		const text = new DynamicText(world, material, "0 - 0");
		const matrix = new THREE.Matrix4();
		matrix.makeRotationY(-Math.PI / 2);
		text.mesh.applyMatrix4(matrix);
		matrix.makeTranslation(-1.38, 0.74, -0.07);
		text.mesh.applyMatrix4(matrix);
		text.mesh.name = "score";
		text.mesh.userData = text;
	}

	{
		const text = new DynamicText(world, material, "0 - 0");
		const matrix = new THREE.Matrix4();
		matrix.makeRotationY(Math.PI / 2);
		text.mesh.applyMatrix4(matrix);
		matrix.makeTranslation(1.38, 0.74, 0.07);
		text.mesh.applyMatrix4(matrix);
		text.mesh.name = "score";
		text.mesh.userData = text;
	}
}

export class Table extends Entity {
	public static readonly UUID = "table";
	public static readonly RESTITUTION = 0.7;

	public name = "table";
	public dynamic = false;

	public constructor(world: Pong, uuid: string) {
		const shape = createShape(world.tableModel!);
		const physicsObject = createPhysicsObject(shape, 0);

		physicsObject.setRestitution(Table.RESTITUTION);
		super(world, uuid, world.tableModel!.clone(), physicsObject);
	}
}

export class Ball extends Entity {
	public static readonly UUID = "ball";
	public static readonly RADIUS = 0.02;
	public static readonly MASS = 0.0027;
	public static readonly RESTITUTION = 0.8;

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

	public earlyTick() {
		if (this.position.y < 0) {
			(this.world as Pong).state.onFloorHit();
			this.removed = true;
		}
	}

	public destroy() {
		this.geometry.dispose();
		this.material.dispose();

		super.destroy();
	}

	public onCollision(other: Entity | null, p0: Vector, p1: Vector) {
		if (other?.name == "table") {
			if (p1.y > 0.785) {
				this.removed ||= !(this.world as Pong).state.onTableHit(null);
			} else {
				this.removed ||= !(this.world as Pong).state.onTableHit(p1.x > 0 ? 1 : 0);
			}
		} else if (other?.name == "paddle") {
			this.removed ||= !(this.world as Pong).state.onPaddleHit((other as Paddle).userID);
		}
	}
}

export class Paddle extends Entity {
	public static readonly MASS = 0.25;
	public static readonly RESTITUTION = 0.7;
	public static readonly LIFETIME = 60;

	public name = "paddle";
	public dynamic = true;
	public userID: number;

	public constructor(world: Pong, uuid: string, userID: number) {
		const shape = createShape(world.paddleModel!);
		const physicsObject = createPhysicsObject(shape, Paddle.MASS);

		physicsObject.setRestitution(Paddle.RESTITUTION);
		super(world, uuid, world.paddleModel!.clone(), physicsObject);
		this.userID = userID;

		if (uuid != world.paddleUUID) {
			this.interpolation = 0.25;
		}
	}

	public earlyTick() {
		if (this.lastUpdate < this.world.time - Paddle.LIFETIME) {
			this.removed = true;
		}

		super.earlyTick();
	}

	public save(): PaddleObject {
		return {
			...super.save(),
			userID: this.userID,
		};
	}

	public load(entity: PaddleUpdate) {
		if (entity.userID !== undefined)
			this.userID = entity.userID;

		super.load(entity);
	}
}

export class Pong extends World {
	public paddleUUID: string;
	public rightController: THREE.XRTargetRaySpace;
	public leftController: THREE.XRTargetRaySpace;
	public rightGamepad?: Gamepad;
	public leftGamepad?: Gamepad;
	public tableModel?: THREE.Object3D;
	public paddleModel?: THREE.Object3D;
	public userID?: number;
	public state: State;
	private mainControllerIndex: number = 0;

	public constructor() {
		super();

		this.paddleUUID = "paddle-" + randomHex(8);
		this.state = new State();

		this.rightController = this.renderer.xr.getController(0);
		this.leftController = this.renderer.xr.getController(1);
		this.rightController.addEventListener("connected", e => this.controllerConnected(e));
		this.leftController.addEventListener("connected", e => this.controllerConnected(e));
		this.cameraGroup.add(this.rightController);
		this.cameraGroup.add(this.leftController);

		this.on("create", netEvent => {
			const event = netEvent as CreateEvent;

			if (event.entity.name == "paddle") {
				const entity = event.entity as PaddleObject;
				const team = this.state.teams[0].players.length > this.state.teams[1].players.length ? 1 : 0;
				const player = this.state.players.find(p => p.user == entity.userID);

				if (player === undefined) {
					this.state.players.push(new Player(this.state, entity.userID, team));
				}
			}
		});

		this.on("ball", netEvent => {
			const event = netEvent as BallEvent;
			const ball = this.get(Ball.UUID);
			const paddle = this.get(event.paddle);

			if (ball === null && paddle !== null && paddle instanceof Paddle) {
				const team = this.state.players.find(player => player.user == paddle.userID)!.team;

				if (this.state.current == team) {
					this.create({
						name: "ball",
						uuid: Ball.UUID,
						pos: paddle.position.add(new Vector(0, 0.25, 0)).add(new Vector(0, 0.473, -0.881).rotate(paddle.rotation).scale(0.05)).intoObject(),
						rot: new Quaternion(0, 0, 0, 1).intoObject(),
						lv: new Vector(0, 3, 0).intoObject(),
						av: new Vector(0, 0, 0).intoObject(),
						tp: null,
						tr: null,
						lu: this.time,
					});
				}
			}
		});

		this.register("ball", object => new Ball(this, object.uuid));
		this.register("paddle", object => new Paddle(this, object.uuid, (object as PaddleObject).userID));
	}

	private controllerConnected(event: any) {
		if (event.data.gamepad.hand === "left") {
			this.leftController = event.target;
			this.leftGamepad = event.data.gamepad;
		} else if (event.data.gamepad.hand === "right") {
			this.rightController = event.target;
			this.rightGamepad = event.data.gamepad;
		}
	}

	public get mainController() {
		if (this.mainControllerIndex == 0) {
			return this.rightController;
		} else {
			return this.leftController;
		}
	}

	public earlyTick() {
		if (this.time >= this.maxTime) {
			this.sendCreateOrUpdate({
				name: "paddle",
				userID: this.userID!,
			}, {
				uuid: this.paddleUUID,
				tp: Vector.fromThree(this.mainController.getWorldPosition(this.mainController.position)).intoObject(),
				tr: Quaternion.fromThree(this.mainController.getWorldQuaternion(this.mainController.quaternion)).intoObject(),
			});
		}

		super.earlyTick();
	}

	public clientTick() {
		const forward = new THREE.Vector3();
		const cross = new THREE.Vector3();
		this.cameraGroup.getWorldDirection(forward);
		cross.crossVectors(forward, new THREE.Vector3(0, 1, 0));

		if (this.rightGamepad) {
			if (Math.abs(this.rightGamepad.axes[1]) > 0.1) {
				this.cameraGroup.position.add(cross.multiplyScalar(-this.rightGamepad.axes[1] / TICKS_PER_SECOND));
			} else if (Math.abs(this.rightGamepad.axes[0]) > 0.1) {
				this.cameraGroup.position.add(forward.multiplyScalar(-this.rightGamepad.axes[0] / TICKS_PER_SECOND));
			}
		}

		if (this.leftGamepad) {
			if (Math.abs(this.leftGamepad.axes[0]) > 0.1) {
				this.cameraGroup.rotateY(-this.leftGamepad.axes[0] * Math.PI / TICKS_PER_SECOND);
			}
		}

		super.clientTick();
	}

	public render(deltaTime: number) {
		const scoreText = `${this.state.teams[0].score} - ${this.state.teams[1].score}`;

		for (let object of this.scene.getObjectsByProperty("name", "score")) {
			const text = object.userData as DynamicText;
			text.text = scoreText;
		}

		super.render(deltaTime);
	}
	
	public save(): Snapshot {
		return {
			state: this.state.save(),
			...super.save(),
		};
	}

	public load(snapshot: Snapshot) {
		this.state.load(snapshot.state);
		super.load(snapshot);
	}

	public async start(options: Options) {
		const paddleTransform = {
			scale: new Vector(0.048, 0.048, 0.048),
			rotate: new Vector(Math.PI / 6 * 4, 0, 0),
			translate: new Vector(0, 0.02, -0.04),
		};

		this.userID = options.user.id;
		this.tableModel = await loadModel("/Assets/gltf/pingPongTable/pingPongTable.gltf");
		this.paddleModel = await loadModel("/Assets/gltf/paddle/paddle.gltf", paddleTransform);

		await createLights(this);
		await createFloor(this);
		await createScoreboard(this);

		this.add(new Table(this, Table.UUID));

		this.leftController.addEventListener("selectstart", () => {
			this.send("ball", {
				paddle: this.paddleUUID,
			});
		});

		this.rightController.addEventListener("selectstart", () => {
			this.send("ball", {
				paddle: this.paddleUUID,
			});
		});

		await super.start(options);

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
			} else if (event.key == " ") {
				this.mainControllerIndex = 1 - this.mainControllerIndex;
			}
		};
	}

	public stop() {
		window.onkeydown = null;

		super.stop();
	}
}
