import { World } from "../Systems/world";
import type { WorldObject, WorldEvent } from "../Systems/world";
import { addRoomToWorld } from "./room";
import { createControllers } from "./controller";
import { Ball } from "./ball";
import { Racket } from "./racket";
import { Euler } from "three";
import type { XRTargetRaySpace, Object3D } from "three";
import { loadModel } from "../Systems/ModelLoader";
import { Vector, Quaternion } from "../Systems/math";
import { Table, createTableTop } from "./table";
import { Socket, io } from "socket.io-client";

export class Game extends World {
	leftController: XRTargetRaySpace | undefined;
	rightController: XRTargetRaySpace | undefined;
	ball: Ball | undefined;
	racket: Racket | undefined;
	racketModel: Object3D | undefined;
	rackets: number[];
	tableModel: Object3D | undefined;
	table: Table | undefined;
	socket: Socket | undefined;

	constructor(container: Element) {
		super(container);
		this.rackets = [];
	}

	onSnapshot(snapshot: WorldObject) {
		if (this.socket !== undefined) {
			this.socket.emit("broadcast", {
				type: "snapshot",
				snapshot: snapshot,
				rackets: this.rackets,
				events: this.events,
			});
		}

		this.events = [];
	}

	onBroadcast(message: any) {
		if (message.type === "snapshot") {
			const remoteSnapshot = message.snapshot as WorldObject;
			const events = message.events as WorldEvent[];
			const rackets = message.rackets as number[];
			const stepTarget = this.stepCount;
			let firstEvent = Infinity;
			let oldSnapshot = null;

			for (let id of rackets) {
				if (!this.rackets.includes(id) && this.racketModel !== undefined) {
					const racket = new Racket(this, undefined, this.racketModel.clone(), id); //clone otherwise it will clear the render for the other racket
					racket.name = "RACKET-" + id;
					this.add(racket);
					this.rackets.push(id);
				}
			}

			for (let event of events) {
				this.allEvents.push(event);
				if (event.stepCount < firstEvent) {
					firstEvent = event.stepCount;
				}
			}

			for (let snapshot of this.snapshots) {
				if (snapshot.stepCount < firstEvent) {
					if (oldSnapshot === null || snapshot.stepCount > oldSnapshot.stepCount) {
						oldSnapshot = snapshot;
					}
				}
			}

			if (remoteSnapshot.stepCount >= stepTarget) {
				if (remoteSnapshot.stepCount >= stepTarget + this.snapshotLifetime / 2) {
					this.loadSnapshot(remoteSnapshot);
				} else if (oldSnapshot !== null) {
					this.loadSnapshot(oldSnapshot);
					this.step(remoteSnapshot.stepCount);
				} else {
					this.step(remoteSnapshot.stepCount);
				}
			} else {
				if (false) {
					let olderSnapshot = null;
					firstEvent = Infinity;

					for (let snapshot of this.snapshots) {
						if (snapshot.stepCount < firstEvent) {
							if (olderSnapshot === null || remoteSnapshot.stepCount > olderSnapshot.stepCount) {
								olderSnapshot = snapshot;
							}
						}
					}

					if (olderSnapshot !== null) {
						let currentSnapshot = this.createSnapshot();
						this.loadSnapshot(olderSnapshot);
						this.step(remoteSnapshot.stepCount);
						let afterSnapshot = this.createSnapshot();

						if (JSON.stringify(afterSnapshot) != JSON.stringify(remoteSnapshot)) {
							console.log("sanity check failed", afterSnapshot, remoteSnapshot);
						}

						this.loadSnapshot(currentSnapshot);
					}
				}

				if (oldSnapshot !== null) {
					this.loadSnapshot(oldSnapshot);
					this.step(stepTarget);
				}
			}

			this.snapshots = this.snapshots.filter(snapshot => snapshot.stepCount > this.stepCount - this.snapshotLifetime);
		}
	}

	async load() {
		const controllers = createControllers(this.renderer, this.scene);
		this.leftController = controllers.left;
		this.leftController.name = "leftcontroller";
		this.rightController = controllers.right;
		this.rightController.name = "rightcontroller";
		this.cameraGroup.add(this.leftController, this.rightController);

		addRoomToWorld(this);

		this.ball = new Ball(this);
		this.ball.name = "BALL";
		this.add(this.ball);

		this.racketModel = await loadModel("./Assets/gltf/newPingPong/newPingPong.gltf", 0.048, new Vector(0, 0.02, -0.04), new Euler(Math.PI/6 + Math.PI / 2,0,0));
		this.tableModel = await loadModel("./Assets/gltf/pingPongTable/pingPongTable.gltf", 1, new Vector(0,0.005,0), new Euler(0,0,0));
		const request = await fetch("http://localhost:3000/whoami", { mode: "cors", credentials: "include" });
		const { id } = await request.json();
		if (this.racketModel === undefined || this.tableModel === undefined) {
			console.log("error loading model")
		} else {
			this.scene.add(createTableTop());
			this.racket = new Racket(this, this.cameraGroup.getObjectByName("rightcontroller"), this.racketModel.clone(), id);
			this.table = new Table(this, this.tableModel);
			this.racket.name = "RACKET-" + id;
			this.add(this.table);
			this.add(this.racket);
			this.rackets.push(id);
		}

		const self = this;
		this.rightController.addEventListener("selectstart", function() {
			if (self.racket !== undefined) {
				console.log("creating ball event");
				self.createEvent({
					type: "move",
					target: "BALL",
					data: {
						position: self.racket.position.add(new Vector(0.05, 0.5, 0)).intoObject(),
						rotation: new Quaternion(0, 0, 0, 1).intoObject(),
						linearVelocity: new Vector(0, 0, 0).intoObject(),
						angularVelocity: new Vector(0, 0, 0).intoObject(),
					}
				});
			}
		});

		this.socket = io("ws://localhost:3000", { withCredentials: true });
		this.socket.on("exception", console.error);
		this.socket.on("broadcast", message => this.onBroadcast(message));
	}
}
