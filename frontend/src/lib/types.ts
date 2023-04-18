import type { Subject, Action } from "./enums";

export type UpdatePacket = {
	subject: Subject,
	action: Action,
	id: number,
	value?: any,
}

export type Objective = {
	name: string,
	description: string,
	color: string,
	threshold: number,
};

export type Achievement = {
	name: string,
	image: string,
	progress: number,
	objectives: Objective[],
};

export type Suggestion = {
	title: string,
	desc: string,
	url: string,
	src: string,
	width: number,
	height: number,
};
