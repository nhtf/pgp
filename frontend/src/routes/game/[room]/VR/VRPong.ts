import { loadModel, createShape } from "./Model";
import { loadAudio } from "./Audio";
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
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

import type { GameRoomMember } from "$lib/entities";

export interface Snapshot extends WorldSnapshot {
	state: StateSnapshot;
}

export interface PaddleObject extends EntityObject {
	userId: number;
	teamID: number;
}

export interface BallEvent extends NetEvent {
	paddle: string;
}

export interface Options extends WorldOptions {
	member: GameRoomMember;
}

export type PaddleUpdate = Partial<PaddleObject>;

function createLights(world: Pong) {
    const ambient = new THREE.AmbientLight("white", 0.9);
	const light = new THREE.PointLight("white", 25);
	light.position.y = 4;
	light.castShadow = true;
	light.shadow.mapSize.width = 2048;
	light.shadow.mapSize.height = 2048;
	world.scene.add(light);
	const areaLight = new THREE.RectAreaLight("white", 10, 62, 1);
	areaLight.position.y = 10.75;
	areaLight.rotation.setFromVector3(new THREE.Vector3(Math.PI / 2, Math.PI, Math.PI / 2));
	const areaLightL = new THREE.RectAreaLight("white", 10, 62, 1);
	areaLightL.position.set(-10, 10.75, 0);
	areaLightL.rotation.setFromVector3(new THREE.Vector3(Math.PI / 2, Math.PI, Math.PI / 2));
	const areaLightR = new THREE.RectAreaLight("white", 10, 62, 1);
	areaLightR.position.set(10, 10.75, 0);
	areaLightR.rotation.setFromVector3(new THREE.Vector3(Math.PI / 2, Math.PI, Math.PI / 2));
	const areaLightCeiling = new THREE.RectAreaLight("white", 1, 62, 36);
	areaLightCeiling.rotation.setFromVector3(new THREE.Vector3(Math.PI / 2, Math.PI, Math.PI / 2));
	areaLightCeiling.position.y = 12.1;
	const helper = new RectAreaLightHelper(areaLightCeiling, "red");
	world.scene.add(areaLight);
	world.scene.add(areaLightL);
	world.scene.add(areaLightR);
	world.scene.add(ambient);
	world.scene.add(areaLightCeiling);
	world.scene.add(helper);
}

function createScoreboard(world: Pong) {
	const material = world.addThreeObject(new THREE.MeshBasicMaterial({ color: 0xff0000 }));

	{
		const text = new DynamicText(world, material, "0 - 0");
		const matrix = new THREE.Matrix4();
		matrix.makeRotationY(-Math.PI / 2);
		text.mesh.applyMatrix4(matrix);
		matrix.makeTranslation(-1.38, 0.74, -0.07);
		text.mesh.applyMatrix4(matrix);
		text.mesh.updateMatrixWorld();
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
		text.mesh.updateMatrixWorld();
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
			(this.world as Pong).state!.onFloorHit();
			this.removed = true;
		}
	}

	public destroy() {
		this.geometry.dispose();
		this.material.dispose();

		super.destroy();
	}

	public onCollision(other: Entity | null, p0: Vector, p1: Vector) {
		const world = (this.world as Pong);
		const pointIndex = world.state!.pointIndex;

		if (other?.name == "table") {
			world.pray("table-sound", 30, () => {
				const index = Math.floor(Math.random() * world.tableSounds!.length);
				world.tableSounds![index].play();
			});

			if (p1.y > 0.785) {
				this.removed ||= !world.state!.onTableHit(null);
			} else {
				this.removed ||= !world.state!.onTableHit(p1.x > 0 ? 1 : 0);
			}
		} else if (other?.name == "paddle") {
			world.pray("paddle-sound", 30, () => {
				const index = Math.floor(Math.random() * world.paddleSounds!.length);
				other.renderObject.add(world.paddleSounds![index]);
				world.paddleSounds![index].play();

				setTimeout(() => {
					other.renderObject.remove(world.paddleSounds![index]);
				}, 500);
			});

			this.removed ||= !world.state!.onPaddleHit((other as Paddle).userId);
		}

		if (world.state!.pointIndex > pointIndex) {
			world.forceSynchronize = true;
		}
	}
}

export class Paddle extends Entity {
	public static readonly MASS = 0.25;
	public static readonly RESTITUTION = 0.7;
	public static readonly LIFETIME = 60;

	public name = "paddle";
	public dynamic = true;
	public userId: number;
	public teamID: number;

	public constructor(world: Pong, uuid: string, userId: number, teamID: number) {
		const shape = createShape(world.paddleModel!);
		const physicsObject = createPhysicsObject(shape, Paddle.MASS);

		physicsObject.setRestitution(Paddle.RESTITUTION);
		super(world, uuid, world.paddleModel!.clone(), physicsObject);
		this.userId = userId;
		this.teamID = teamID;

		if (uuid != world.paddleUUID) {
			this.interpolation = 0.25;
		}
	}

	public earlyTick() {
		if (this.lastUpdate < this.world.time - Paddle.LIFETIME) {
			// console.log("Removing paddle", this.uuid, this.lastUpdate, this.world.time, Paddle.LIFETIME);
			this.removed = true;
		}

		super.earlyTick();
	}

	public save(): PaddleObject {
		return {
			...super.save(),
			userId: this.userId,
			teamID: this.teamID,
		};
	}

	public load(entity: PaddleUpdate) {
		if (entity.userId !== undefined)
			this.userId = entity.userId;

		if (entity.teamID !== undefined)
			this.teamID = entity.teamID;

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
	public hallModel?: THREE.Object3D;
	public member?: GameRoomMember;
	public state?: State;
	public tableSounds?: THREE.PositionalAudio[];
	public paddleSounds?: THREE.PositionalAudio[];
	private mainControllerIndex: number = 0;

	public constructor() {
		super();

		this.paddleUUID = "paddle-" + randomHex(8);

		this.rightController = this.renderer.xr.getController(0);
		this.leftController = this.renderer.xr.getController(1);
		this.rightController.addEventListener("connected", e => this.controllerConnected(e, 0));
		this.leftController.addEventListener("connected", e => this.controllerConnected(e, 1));
		this.cameraGroup.add(this.rightController);
		this.cameraGroup.add(this.leftController);

		this.on("create", netEvent => {
			const event = netEvent as CreateEvent;

			if (event.entity.name == "paddle") {
				const entity = event.entity as PaddleObject;
				const team = this.state!.teams.find(team => team.id == entity.teamID)!;
				const player = this.state!.players.find(p => p.user == entity.userId);

				if (player === undefined) {
					this.state!.players.push(new Player(this.state!, entity.userId, team));
				}
			}
		});

		this.on("ball", netEvent => {
			const event = netEvent as BallEvent;
			const ball = this.get(Ball.UUID);
			const paddle = this.get(event.paddle);

			if (ball === null && paddle !== null && paddle instanceof Paddle) {
				const team = this.state!.players.find(player => player.user == paddle.userId)!.team;

				// console.log(this.state!.current?.id, team?.id);

				if (this.state!.current == team) {
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
		this.register("paddle", obj => {
			const object = obj as PaddleObject;
			return new Paddle(this, object.uuid, object.userId, object.teamID);
		});
	}

	private controllerConnected(event: any, index: number) {
		// console.log("connected: ", event);
		if (!event.data.gamepad) {
			if (index === 0) {
				this.leftController = event.target;
			} else {
				this.rightController = event.target;
			}
		} else {
			if (event.data.gamepad.hand === "left") {
				this.leftController = event.target;
				this.leftGamepad = event.data.gamepad;
			} else if (event.data.gamepad.hand === "right") {
				this.rightController = event.target;
				this.rightGamepad = event.data.gamepad;
			}
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
		if (this.time >= this.maxTime && this.member!.player != null) {
			this.sendCreateOrUpdate({
				name: "paddle",
				userId: this.member!.userId,
				teamID: this.member!.player?.teamId,
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

		let handedness = "unknown";
		const session = this.renderer.xr.getSession();
		if (session) {
			for (const source of session.inputSources) {
                if (source && source.handedness) {
                    handedness = source.handedness; //left or right controllers
                }
				if (!source.gamepad) continue;
				const data = {
					handedness: handedness,
					buttons: source.gamepad.buttons.map((b) => b.value),
					axes: source.gamepad.axes.slice(0)
				};
				
				if (handedness === "right") {
					// console.log(data.axes);
					if (Math.abs(data.axes[2]) > 0.1)
						this.cameraGroup.position.add(cross.multiplyScalar(-data.axes[2] / TICKS_PER_SECOND));
					if (Math.abs(data.axes[3]) > 0.1)
						this.cameraGroup.position.add(forward.multiplyScalar(data.axes[3] / TICKS_PER_SECOND));
				}
				else if (handedness === "left") {
					if (Math.abs(data.axes[2]) > 0.1) {
						this.cameraGroup.rotateY(-data.axes[2] * Math.PI / TICKS_PER_SECOND);
					}
				}
		}
		}

		super.clientTick();
	}

	public render(deltaTime: number) {
		const scoreText = `${this.state!.teams[0].score} - ${this.state!.teams[1].score}`;

		for (let object of this.scene.getObjectsByProperty("name", "score")) {
			const text = object.userData as DynamicText;
			text.text = scoreText;
		}
		super.render(deltaTime);
	}
	
	public save(): Snapshot {
		return {
			state: this.state!.save(),
			...super.save(),
		};
	}

	public load(snapshot: Snapshot) {
		this.state!.load(snapshot.state);
		super.load(snapshot);
	}

	public async start(options: Options) {
		const paddleTransform = {
			scale: new Vector(0.048, 0.048, 0.048),
			rotate: new Vector(Math.PI / 6 * 4, 0, 0),
			translate: new Vector(0, 0.02, -0.04),
		};

		this.member = options.member;
		this.state = new State(options.room.state!.teams);
		const load = await Promise.all([Promise.all([loadModel("/Assets/gltf/paddle/paddle.gltf", paddleTransform), loadModel("/Assets/gltf/PGP_HALL/PGP_HALL.glb")]), Promise.all([...Array(33).keys()].map(i => loadAudio(this.audioListener, `/Assets/cut-sounds/vloer steen/${i}.wav`))), Promise.all([...Array(88).keys()].map(i => loadAudio(this.audioListener, `/Assets/cut-sounds/racket bounce/${i}.wav`)))]);
		let modelArray = load[0];
		this.tableModel =  modelArray[1].children[0].children.filter((child) => child.name === "MainTable")![0];
		this.paddleModel =  modelArray[0];
		this.hallModel =  modelArray[1];
		this.scene.add(this.hallModel);

		this.tableSounds = load[1];
		this.paddleSounds = load[2];
		this.paddleSounds.forEach(sound => sound.setVolume(3.0));

		createLights(this);
		createScoreboard(this);

		const table = new Table(this, Table.UUID);
		this.tableSounds.forEach(sound => table.renderObject.add(sound));
		this.add(table);
		this.scene.remove(table.renderObject);

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
