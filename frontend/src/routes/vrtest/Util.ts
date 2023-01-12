export function randomHex(size: number): string {
	return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

export class Counter {
	private maxTime: number;
	private samples: { time: number, value: number }[];

	private static getTime(): number {
		return new Date().getTime() / 1000;
	}

	public constructor(maxTime: number) {
		this.maxTime = maxTime;
		this.samples = [];
	}

	public clean() {
		const time = Counter.getTime();
		this.samples = this.samples.filter(s => time - s.time < this.maxTime);
	}

	public add(value: number) {
		const time = Counter.getTime();
		this.samples.push({ time, value });
		this.clean();
	}

	public average(): number {
		this.clean();
		return this.samples.map(s => s.value).reduce((p, c) => p + c);
	}
}
