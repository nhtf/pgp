export {}

// Crashes when frontend restarts 

declare global {
	export interface Array<T> {
		filter_map: <U>(this: Array<T>, fun: (element: T) => U | undefined) => U[]
	}
}

function filter_map<T, U>(this: Array<T>, fun: (element: T) => U | undefined): U[] {
	const mapped: U[] = [];

	this.forEach((element) => {
		const result = fun(element);

		if (result !== undefined) {
			mapped.push(result);
		}
	});

	return mapped;
}

Object.defineProperty(Array.prototype, "filter_map", {
	value: filter_map
});
