import type { VectorObject } from "./Math2D";
import type { Snapshot as NetSnapshot, Event as NetEvent, Options as NetOptions } from "../Net";
import type { User } from "$lib/types";

export interface BallObject {
	position: VectorObject;
	velocity: VectorObject;
}

export interface PaddleObject {
	position: VectorObject;
	height: number;
    width: number;
	userID?: number;
}

export interface Snapshot extends NetSnapshot {
	ball: BallObject;
	paddles: PaddleObject[];
}

export interface MouseEvent extends NetEvent {
	u: number;
	y: number;
}

export interface Options extends NetOptions {
	user: User;
}