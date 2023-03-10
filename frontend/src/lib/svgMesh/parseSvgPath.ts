
/**
 * expected argument lengths
 * @type {Object}
 */

// const length = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0}
const length: Map<string, number> = new Map([
    ["a", 7],
    ["c", 6], 
    ["h", 1], 
    ["l", 2], 
    ["m", 2], 
    ["q", 4], 
    ["s", 4], 
    ["t", 2], 
    ["v", 1], 
    ["z", 0],
]);

/**
 * segment pattern
 * @type {RegExp}
 */

const segment = /([astvzqmhlc])([^astvzqmhlc]*)/ig

export type parseData = {
    command: string;
    args: number[];
}

/**
 * parse an svg path data string. Generates an Array
 * of commands where each command is an Array of the
 * form `[command, arg1, arg2, ...]`
 *
 * @param {String} path
 * @return {Array}
 */

export function parse(path: string) {
	let data: parseData[] = [];
	path.replace(segment, (_, command: string, args: string): string => {
		let type: string = command.toLowerCase();
		let parsedArgs = parseValues(args);

		// overloaded moveTo
		if (type == 'm' && parsedArgs.length > 2) {
			data.push(
                {command: command,
                args: parsedArgs.splice(0, 2),}
                );
			type = 'l';
			command = command == 'm' ? 'l' : 'L';
		}

		while (true) {
			if (parsedArgs.length == length.get(type)) {
				return data.push(
                    {command: command,
                    args: parsedArgs}
                    ).toString();
			}
			if (parsedArgs.length < length.get(type)!) throw new Error('malformed path data')
			data.push(
                {command: command,
                args: parsedArgs.splice(0, length.get(type)!)});
		}
	})
	return data;
}

let number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig

function parseValues(args: string) {
	var numbers = args.match(number)
	return numbers ? numbers.map(Number) : []
}
