import type { VectorObject } from "./Math2D";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "../Net";
import type { GameRoomMember, User } from "$lib/entities";

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
}

export interface Snapshot extends NetSnapshot {
	ball: BallObject;
	paddles: PaddleObject[];
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
	user: User; // TODO: replace by .member
	member: GameRoomMember;
}
