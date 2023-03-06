import type { Subject, Action } from "./enums";

export type UpdatePacket = {
	subject: Subject,
	action: Action,
	id: number,
	value?: any,
}

export type Achievement = {
	name: string,
	icon: string,
	have: boolean,
	text: string[],
	level: number,
	progress: number,
	level_cost: number[],
};

export type Suggestion = {
	title: string,
	desc: string,
	url: string,
	src: string,
	width: number,
	height: number,
}
