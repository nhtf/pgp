import type { GameRoom } from "$lib/entities" 
import { BACKEND_WS } from "$lib/constants";
import { Socket, io } from "socket.io-client";
import { Counter, randomHex } from "./Util";
import { Father, Bible } from "./SignFromGod";
import Swal from "sweetalert2";

export const PING_INTERVAL = 20;
export const SNAPSHOT_INTERVAL = 6;
export const UPDATE_INTERVAL = 3;
export const MERGE_INTERVAL = 3;
export const SYNCHRONIZE_INTERVAL = 120;
export const FORCE_SYNCHRONIZE_INTERVAL = 30;
export const HISTORY_LIFETIME = 300;
export const DESYNC_CHECK_INTERVAL = 60;
export const DESYNC_CHECK_DELTA = 120;
export const REPLAY_CHECK_INTERVAL = 0;
export const REPLAY_CHECK_DELTA = 1;
export const SAVE_ALL_SNAPSHOTS = false;
export const REFRESH_ON_DESYNC = true;

let doingDesyncCheck = false;

export interface Snapshot {
	time: number;
}

export interface Event {
	name: string;
	uuid: string;
	time: number;
}

export interface Options {
	address?: string;
	room: GameRoom;
}

export class Net {
	public time: number;
	public maxTime: number;
	public minTime: number | null;
	public bandwidthDownload: Counter;
	public bandwidthUpload: Counter;
	public latencyNetwork: Counter;
	public tickCounter: Counter;
	public father: Father;
	public forceSynchronize: boolean;
	private snapshots: [Snapshot, Bible][];
	private allSnapshots: Snapshot[];
	private allEvents: Event[];
	private newEvents: Event[];
	private listeners: Map<string, { (event: Event): void; }[]>;
	private socket: Socket | null;
	private lastSync: number;

	protected constructor() {
		this.time = 0;
		this.maxTime = 0;
		this.minTime = null;
		this.bandwidthDownload = new Counter(5);
		this.bandwidthUpload = new Counter(5);
		this.latencyNetwork = new Counter(5);
		this.tickCounter = new Counter(5);
		this.father = new Father();
		this.forceSynchronize = false;
		this.snapshots = [];
		this.allSnapshots = [];
		this.allEvents = [];
		this.newEvents = [];
		this.listeners = new Map();
		this.socket = null;
		this.lastSync = 0;
	}

	protected save(): Snapshot {
		return {
			time: this.time,
		};
	}
	
	protected load(snapshot: Snapshot) {
		this.time = snapshot.time;
		this.maxTime = Math.max(this.time, this.maxTime);
		// console.log(`load time=${this.time} hash=${hashCode(JSON.stringify(this.save()))}`);
	}

	public on(name: string, listener: { (event: Event): void }) {
		const listeners = this.listeners.get(name);

		if (listeners !== undefined) {
			listeners.push(listener);
		} else {
			this.listeners.set(name, [listener]);
		}
	}

	private clean() {
		this.snapshots = this.snapshots.filter(x => x[0].time >= this.time - HISTORY_LIFETIME);
		this.allEvents = this.allEvents.filter(x => x.time >= this.time - HISTORY_LIFETIME);
	}

	private getEventIndex(time: number): number {
		let begin = 0;
		let end = this.allEvents.length;

		while (true) {
			let middle = Math.floor((begin + end) / 2);

			if (end == middle) {
				return end;
			}

			if (this.allEvents[middle].time < time) {
				begin = middle + 1;
			} else {
				end = middle;
			}
		}
	}

	public earlyTick() {
		let index = this.getEventIndex(this.time);

		while (index < this.allEvents.length && this.allEvents[index].time == this.time) {
			const event = this.allEvents[index];

			// console.log(`event time=${this.time} name=${event.name} hash=${hashCode(JSON.stringify(event))}`);
			
			if (doingDesyncCheck) {
				// console.log(event);
			}

			const listeners = this.listeners.get(event.name);

			if (listeners !== undefined) {
				listeners.forEach(listener => listener(event));
			}

			index += 1;
		}
	}

	public lateTick() {
		this.time += 1;

		if (this.time % SNAPSHOT_INTERVAL == 0) {
			this.snapshots = this.snapshots.filter(x => x[0].time != this.time);
			this.snapshots.push([this.save(), this.father.publishBible()]);
			this.clean();
		}

		if (SAVE_ALL_SNAPSHOTS) {
			this.allSnapshots = this.allSnapshots.filter(x => x.time != this.time);
			this.allSnapshots.push(this.save());

			if (this.time % DESYNC_CHECK_INTERVAL == DESYNC_CHECK_INTERVAL - DESYNC_CHECK_DELTA - SNAPSHOT_INTERVAL) {
				// console.log("snapshot", this.save());
			}
		}

		if (this.time > this.maxTime) {
			this.maxTime = this.time;

			if (this.time % PING_INTERVAL == 0) {
				this.socket?.emit("ping", { time: new Date().getTime() });
			}

			if (this.time % MERGE_INTERVAL == 0) {
				this.applyMerge();
			}

			if (this.time % UPDATE_INTERVAL == 0) {
				this.broadcast({
					name: "update",
					events: this.newEvents.splice(0),
				});
			}

			if (this.time - this.lastSync >= SYNCHRONIZE_INTERVAL || (this.forceSynchronize && this.time - this.lastSync > FORCE_SYNCHRONIZE_INTERVAL)) {
				// console.log("synchronize", this.time);

				this.broadcast({
					name: "synchronize",
					time: this.time,
					snapshot: this.snapshots[0][0],
					current: this.getLatest(this.time)![0],
					events: this.allEvents
				});

				this.lastSync = this.time;
				this.forceSynchronize = false;
			}

			if (DESYNC_CHECK_INTERVAL > 0 && this.time % DESYNC_CHECK_INTERVAL == 0 && this.time > DESYNC_CHECK_DELTA + SYNCHRONIZE_INTERVAL) {
				const latest = this.getLatest(this.time - DESYNC_CHECK_DELTA);

				if (latest !== null) {
					// console.log(`sending desync check for ${latest[0].time} (real time is ${this.time}, outgoing hash is ${hashCode(JSON.stringify(latest[0]))})`);
					// console.log(latest[0]);

					this.broadcast({
						name: "desync-check",
						snapshot: latest[0],
					});
				}
			}

			if (REPLAY_CHECK_INTERVAL > 0 && this.time % REPLAY_CHECK_INTERVAL == 0 && this.time > REPLAY_CHECK_INTERVAL + SYNCHRONIZE_INTERVAL) {
				const latest = this.getLatest(this.time - REPLAY_CHECK_DELTA);

				if (latest !== null) {
					const beforeState = this.save();
					doingDesyncCheck = true;
					this.load(latest[0]);
					this.father.regress(latest[1]);
					this.forward(this.maxTime);
					doingDesyncCheck = false;
					const afterState = this.save();
					
					// console.log(`replay check for ${latest[0].time} (real time is ${this.time}, before hash is ${hashCode(JSON.stringify(beforeState))}, after hash is ${hashCode(JSON.stringify(afterState))})`);
	
					if (JSON.stringify(beforeState) != JSON.stringify(afterState)) {
						// console.log(JSON.stringify(beforeState), JSON.stringify(afterState));
						if (REFRESH_ON_DESYNC) {
							window.location.reload();
						} else {
							debugger;
						}
					}
				}
			}
		}
	}

	public tick() {
		this.tickCounter.add(1);
		this.earlyTick();
		this.lateTick();
		// console.log(`tick time=${this.time} hash=${hashCode(JSON.stringify(this.save()))}`);
	}

	private forward(target: number) {
		while (this.time < target) {
			this.tick();

			if (doingDesyncCheck) {
				// console.log(this.save());
			}
		}
	}

	public send(name: string, event: any) {
		event.name = name;
		event.time = this.time;
		event.uuid = randomHex(8);
		this.allEvents.splice(this.getEventIndex(event.time), 0, event as Event);
		this.newEvents.push(event as Event);

		this.allEvents.sort((a, b) => {
			if (a.time != b.time) {
				return a.time - b.time;
			} else {
				return a.uuid.localeCompare(b.uuid);
			}
		});
	}

	private merge(events: Event[]) {
		const eventUUIDs = new Set();

		for (let event of this.allEvents) {
			eventUUIDs.add(event.uuid);
		}

		for (let event of events) {
			if (!eventUUIDs.has(event.uuid) && event.time >= this.time - HISTORY_LIFETIME) {
				this.allEvents.push(event);

				if (this.minTime === null || this.minTime > event.time) {
					this.minTime = event.time;
				}
			}
		}

		this.allEvents.sort((a, b) => {
			if (a.time != b.time) {
				return a.time - b.time;
			} else {
				return a.uuid.localeCompare(b.uuid);
			}
		});
	}

	private getLatest(before: number): [Snapshot, Bible] | null {
		let latest = null;

		for (let snapshot of this.snapshots) {
			if (snapshot[0].time <= before) {
				if (latest === null || snapshot[0].time > latest[0].time) {
					latest = snapshot;
				}
			}
		}

		return latest;
	}

	private applyMerge() {
		if (this.minTime !== null) {
			let latest = this.getLatest(this.minTime);

			if (latest === null) {
				console.error("possible desync in applyMerge");
			}

			if (latest === null && this.snapshots.length > 0) {
				latest = this.snapshots[0];
			}

			if (latest !== null) {
				this.load(latest[0]);
				this.father.regress(latest[1]);
				this.forward(this.maxTime);
			}
		}

		// console.log("apply merge", new Date().getTime());

		this.minTime = null;
	}

	public async start(options: Options) {
		this.snapshots.push([this.save(), this.father.publishBible()]);

		this.socket = io(options.address ?? `${BACKEND_WS}/game`, { withCredentials: true });

		this.socket!.on("connect", () => {
			this.socket!.emit("join", { id: options.room.id });
		});

		this.socket.on("exception", (err) => {
			Swal.fire({
				icon: "error",
				text: `Net.ts: ${err.message}`,
			});
		});

		this.socket.on("broadcast", message => {
			this.bandwidthDownload.add(JSON.stringify(message).length);

			switch (message.name) {
				case "update":
					this.merge(message.events);
					break;
				case "synchronize":
					if (message.snapshot.time > this.time) {
						this.minTime = null;
						this.load(message.snapshot);
						this.snapshots = [[message.snapshot, this.father.publishBible()]];
					}
	
					this.maxTime = Math.max(this.maxTime, message.time);
					this.merge(message.events);
					this.forward(message.time);
					break;
				case "desync-check":
					let latest = this.getLatest(message.snapshot.time - 1);
	
					if (latest !== null && this.time > DESYNC_CHECK_DELTA + SYNCHRONIZE_INTERVAL) {
						// console.log(`running desync check of ${message.snapshot.time} (real time is ${this.time}, incoming hash is ${hashCode(JSON.stringify(message.snapshot))})`);

						doingDesyncCheck = true;
						this.load(latest[0]);
						this.father.regress(latest[1]);
						// console.log(this.save());
						this.forward(message.snapshot.time);
						doingDesyncCheck = false;
						const testState = this.save();
						latest = this.getLatest(this.maxTime)!;
						this.load(latest[0]);
						this.father.regress(latest[1]);
						this.forward(this.maxTime);
	
						if (JSON.stringify(testState) != JSON.stringify(message.snapshot)) {
							// console.log(JSON.stringify(testState));
							// console.log(JSON.stringify(message.snapshot));
							if (REFRESH_ON_DESYNC) {
								window.location.reload();
							} else {
								debugger;
							}
						}
					}
					break;
			}
		});

		this.socket.on("pong", message => {
			this.latencyNetwork.add(new Date().getTime() - message.time);
		});
	}

	private broadcast(message: any) {
		this.bandwidthUpload.add(JSON.stringify(message).length);
		this.socket?.emit("broadcast", message);
	}

	public stop() {
		this.socket?.close();
	}

	public pray(subject: string, significance: number, callToAction: () => void) {
		this.father.pray(subject, this.time, significance, callToAction);
	}
}
