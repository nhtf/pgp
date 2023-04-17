import type { VectorObject } from "./Math2D";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "../Net";
import type { GameRoomMember } from "$lib/entities";

export interface BallObject {
	position: VectorObject;
	velocity: VectorObject;
}

export interface PaddleObject {
	position: VectorObject;
	height: number;
    width: number;
	ping: number;
	rotation: number;
	transform?: string;
	userId?: number;
}

export interface Snapshot extends NetSnapshot {
	ball: BallObject;
	paddles: PaddleObject[];
	current: number;
	state: {
		teams: TeamObject[];
		finished: boolean;
	};
}

export interface MouseEvent extends NetEvent {
	u: number;
	t: number;
	y: number;
}

export interface ServeEvent extends NetEvent {
	u: number;
}

export interface PingEvent extends NetEvent {
	u: number;
}

export interface Options extends NetOptions {
	member: GameRoomMember;
}

export interface TeamObject {
	id: number;//Id
	score: number;//Score
	ping: number;//Ping
	user?: number;//UserID
	active?: boolean;
}
