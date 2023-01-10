import { Socket, io } from "socket.io-client";

export const SNAPSHOT_INTERVAL = 6;
export const UPDATE_INTERVAL = 3;
export const SYNCHRONIZE_INTERVAL = 120;
export const HISTORY_LIFETIME = 300;

export interface Snapshot {
	time: number;
}

export interface Event {
	name: string;
	uuid: string;
	time: number;
}

export interface Options {
	address: string | null;
}

export class State {
	public time: number;
	public maxTime: number;
	public targetTime: number;
	private snapshots: Snapshot[];
	private allEvents: Event[];
	private newEvents: Event[];
	private listeners: Map<string, { (event: Event): void; }[]>;
	private socket: Socket | null;

	protected constructor() {
		this.time = 0;
		this.maxTime = 0;
		this.targetTime = 0;
		this.snapshots = [];
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

		if (this.time > this.maxTime) {

			if (this.time % UPDATE_INTERVAL == 0 && this.socket !== null) {
				this.socket.emit("broadcast", {
					name: "update",
					events: this.newEvents.splice(0),
				});
			}

			if (this.time % SYNCHRONIZE_INTERVAL == 0 && this.socket !== null) {
				this.socket.emit("broadcast", {
					name: "synchronize",
					time: this.time,
					snapshot: this.snapshots[0],
					events: this.allEvents
				});
			}

			this.maxTime = this.time;
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
		event.uuid = crypto.randomUUID();
		this.allEvents.push(event as Event);
		this.newEvents.push(event as Event);
	}

	private merge(events: Event[]) {
		let oldest = null;
		let newEvents = 0;
		const eventUUIDs = new Set();

		for (let event of this.allEvents) {
			eventUUIDs.add(event.uuid);
		}

		for (let event of events) {
			if (!eventUUIDs.has(event.uuid) && event.time >= this.time - HISTORY_LIFETIME) {
				this.allEvents.push(event);
				newEvents += 1;

				if (oldest === null || oldest > event.time) {
					oldest = event.time;
				}
			}
		}


		if (oldest !== null) {
			let latest = null;

			for (let snapshot of this.snapshots) {
				if (snapshot.time < oldest) {
					if (latest === null || snapshot.time > latest.time) {
						latest = snapshot;
					}
				}
			}

			if (latest === null && this.snapshots.length > 0) {
				latest = this.snapshots[0];
			}

			if (latest !== null) {
				console.log(latest.time, "->", oldest, "->", this.time, "~", this.time - latest.time, "+", newEvents);

				const oldTime = this.time;
				this.load(latest);
				this.forward(oldTime);
			}
		}
	}

	public start(options: Options) {
		this.socket = io(options.address ?? "ws://localhost:3000", { withCredentials: true });
		this.socket.on("exception", console.error);
		this.socket.on("broadcast", message => {
			if (message.name === "update") {
				this.merge(message.events);
			} else if (message.name === "synchronize") {
				if (message.snapshot.time > this.time) {
					this.load(message.snapshot);
					this.snapshots.push(message.snapshot);
					this.clean();
				}

				if (message.time > this.time) {
					this.targetTime = message.time;
				}

				this.merge(message.events);
				this.forward(message.time);
			}
		});
	}
}
