export function randomHex(size: number): string {
	return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

export class Counter {
	private maxTime: number;
	private samples: { time: number, value: number }[];
	private lastClean: number;

	private static getTime(): number {
		return Date.now() / 1000;
	}

	public constructor(maxTime: number) {
		this.maxTime = maxTime;
		this.samples = [];
		this.lastClean = 0;
	}

	public clean() {
		const time = Counter.getTime();
		this.samples = this.samples.filter(s => time - s.time < this.maxTime);
		this.lastClean = time;
	}

	public add(value: number) {
		const time = Counter.getTime();
		this.samples.push({ time, value });

		if (time - this.lastClean > 1) {
			this.clean();
		}
	}

	public sum(): number {
		this.clean();
		return this.samples.map(s => s.value).reduce((p, c) => p + c, 0);
	}

	public averageOverSamples(): number {
		return this.sum() / this.samples.length;
	}

	public averageOverTime(): number {
		return this.sum() / this.maxTime;
	}
}

export class Map2<K1, K2, V> {
	private map: Map<K1, Map<K2, V>>;

	public constructor() {
		this.map = new Map();
	}

	public clear() {
		this.map.clear();
	}

	public delete(key1: K1, key2: K2): boolean {
		return this.map.get(key1)?.delete(key2) ?? false;
	}

	public get(key1: K1, key2: K2): V | undefined {
		return this.map.get(key1)?.get(key2);
	}

	public has(key1: K1, key2: K2): boolean {
		return this.map.get(key1)?.has(key2) ?? false;
	}

	public entries(): [K1, K2, V][] {
		const result: [K1, K2, V][] = [];

		for (let [key1, val1] of this.map.entries()) {
			for (let [key2, val2] of val1.entries()) {
				result.push([key1, key2, val2]);
			}
		}

		return result;
	}

	public set(key1: K1, key2: K2, value: V): Map2<K1, K2, V> {
		let map = this.map.get(key1);

		if (map === undefined) {
			map = new Map();
			this.map.set(key1, map);
		}

		map.set(key2, value);

		return this;
	}
}

export function hashCode(str: string): number {
	let hash = 0;

	for (let i = 0; i < str.length; i++) {
		let chr = str.charCodeAt(i);
		hash = (hash * 31 + chr) | 0;
	}

	return hash;
}
