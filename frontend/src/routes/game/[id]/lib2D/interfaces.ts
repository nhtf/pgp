import type { VectorObject } from "./Math2D";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "../Net";
import type { GameRoomMember, User } from "$lib/entities";
import type { Team } from "../lib2D/Team";

export interface BallObject {
	position: VectorObject;
	velocity: VectorObject;
}

export interface PaddleObject {
	position: VectorObject;
	height: number;
    width: number;
	userID?: number;
	ping: number;
	rotation: number;
	transform?: string;
}

export interface Snapshot extends NetSnapshot {
	ball: BallObject;
	paddles: PaddleObject[];
	state: {
		teams: TeamObject[];
	};
}

export interface MouseEvent extends NetEvent {
	u: number;
	t: number;
	y: number;
}

export interface PingEvent extends NetEvent {
	u: number;
};

export interface Options extends NetOptions {
	member: GameRoomMember;
}

export interface TeamObject {
	id: number;//Id
	score: number;//Score
	user?: number;//UserID
	ping: number;//Ping
}
