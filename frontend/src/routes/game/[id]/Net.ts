import { Socket, io } from "socket.io-client";
import { Counter, randomHex } from "./Util";

export const SNAPSHOT_INTERVAL = 6;
export const UPDATE_INTERVAL = 3;
export const MERGE_INTERVAL = 3;
export const SYNCHRONIZE_INTERVAL = 120;
export const HISTORY_LIFETIME = 300;
export const DESYNC_CHECK_INTERVAL = 0;
export const DESYNC_CHECK_DELTA = 0;
export const SAVE_ALL_SNAPSHOTS = false;

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
}

export class Net {
	public time: number;
	public maxTime: number;
	public minTime: number | null;
	public bandwidthDownload: Counter;
	public bandwidthUpload: Counter;
	private snapshots: Snapshot[];
	private allSnapshots: Snapshot[];
	private allEvents: Event[];
	private newEvents: Event[];
	private listeners: Map<string, { (event: Event): void; }[]>;
	private socket: Socket | null;

	protected constructor() {
		this.time = 0;
		this.maxTime = 0;
		this.minTime = null;
		this.bandwidthDownload = new Counter(5);
		this.bandwidthUpload = new Counter(5);
		this.snapshots = [];
		this.allSnapshots = [];
		this.allEvents = [];
		this.newEvents = [];
		this.listeners = new Map();
		this.socket = null;
	}

	protected save(): Snapshot {
		return {
			time: this.time,
		};
	}
	
	protected load(snapshot: Snapshot) {
		this.time = snapshot.time;
		this.maxTime = Math.max(this.time, this.maxTime);
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
		this.snapshots = this.snapshots.filter(x => x.time >= this.time - HISTORY_LIFETIME);
		this.allEvents = this.allEvents.filter(x => x.time >= this.time - HISTORY_LIFETIME);
	}

	public earlyTick() {
		for (let event of this.allEvents) {
			if (event.time == this.time) {
				const listeners = this.listeners.get(event.name);

				if (listeners !== undefined) {
					listeners.forEach(listener => listener(event));
				}
			}
		}
	}

	public lateTick() {
		this.time += 1;

		if (this.time % SNAPSHOT_INTERVAL == 0) {
			this.snapshots = this.snapshots.filter(x => x.time != this.time);
			this.snapshots.push(this.save());
			this.clean();
		}

		if (SAVE_ALL_SNAPSHOTS) {
			this.allSnapshots = this.allSnapshots.filter(x => x.time != this.time);
			this.allSnapshots.push(this.save());
		}

		if (this.time > this.maxTime) {
			this.maxTime = this.time;

			if (this.time % MERGE_INTERVAL == 0) {
				this.applyMerge();
			}

			if (this.time % UPDATE_INTERVAL == 0) {
				this.broadcast({
					name: "update",
					events: this.newEvents.splice(0),
				});
			}

			if (this.time % SYNCHRONIZE_INTERVAL == 0 && this.socket !== null) {
				this.broadcast({
					name: "synchronize",
					time: this.time,
					snapshot: this.snapshots[0],
					events: this.allEvents
				});
			}

			if (DESYNC_CHECK_INTERVAL > 0 && this.time % DESYNC_CHECK_INTERVAL == 0 && this.time > DESYNC_CHECK_DELTA + SYNCHRONIZE_INTERVAL && this.socket !== null) {
				const latest = this.getLatest(this.time - DESYNC_CHECK_DELTA);

				if (latest !== null) {
					this.broadcast({
						name: "desync-check",
						snapshot: latest,
					});
				}
			}
		}
	}

	public tick() {
		this.earlyTick();
		this.lateTick();
	}

	private forward(target: number) {
		while (this.time < target) {
			this.tick();
		}
	}

	public send(name: string, event: any) {
		event.name = name;
		event.time = this.time;
		event.uuid = randomHex(8);
		this.allEvents.push(event as Event);
		this.newEvents.push(event as Event);
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
	}

	private getLatest(before: number): Snapshot | null {
		let latest = null;

		for (let snapshot of this.snapshots) {
			if (snapshot.time < before) {
				if (latest === null || snapshot.time > latest.time) {
					latest = snapshot;
				}
			}
		}

		return latest;
	}

	private applyMerge() {
		if (this.minTime !== null) {
			let latest = this.getLatest(this.minTime);

			if (latest === null && this.snapshots.length > 0) {
				latest = this.snapshots[0];
			}

			if (latest !== null) {
				this.load(latest);
				this.forward(this.maxTime);
			}
		}

		this.minTime = null;
	}

	public start(options: Options) {
		this.snapshots.push(this.save());

		this.socket = io(options.address ?? "ws://localhost:3000", { withCredentials: true });
		this.socket.on("exception", console.error);
		this.socket.on("broadcast", message => {
			this.bandwidthDownload.add(JSON.stringify(message).length);

			if (message.name === "update") {
				this.merge(message.events);
			} else if (message.name === "synchronize") {
				if (message.snapshot.time > this.time) {
					this.load(message.snapshot);
					this.snapshots.push(message.snapshot);
					this.clean();
				}

				this.maxTime = Math.max(this.maxTime, message.time);
				this.merge(message.events);
				this.applyMerge();
			} else if (message.name === "desync-check") {
				let latest = this.getLatest(message.snapshot.time);

				if (latest !== null && this.time > DESYNC_CHECK_DELTA + SYNCHRONIZE_INTERVAL) {
					console.log("running desync check");

					this.load(latest);
					this.forward(message.snapshot.time);
					const testState = this.save();
					this.load(this.snapshots[this.snapshots.length - 1]);
					this.forward(this.maxTime);

					if (JSON.stringify(testState) != JSON.stringify(message.snapshot)) {
						debugger;
					}
				}
			}
		});
	}

	private broadcast(message: any) {
		this.bandwidthUpload.add(JSON.stringify(message).length);
		this.socket?.emit("broadcast", message);
	}

	public stop() {
		this.socket?.close();
	}
}
