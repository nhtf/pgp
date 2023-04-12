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

export type Objective = {
	name: string,
	description: string,
	color: string,
	threshold: number,
};

export type NewAchievement = {
	id: number,
	name: string,
	image: string,
	max: number,
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
