export enum Subject {
	USER,
	INVITE,
	ROOM,
	MEMBER,
	FRIEND,
	MESSAGE,
	SCORE,
}

export enum Action {
	ADD,
	SET,
	REMOVE,
}

export enum Role {
	MEMBER,
	ADMIN,
	OWNER,
};

export enum Access {
	PUBLIC,
	PROTECTED,
	PRIVATE,
};

export enum Gamemode {
	CLASSIC,
	VR,
	MODERN,
	MODERN4P
};

export enum Status {
	OFFLINE,
	IDLE,
	ACTIVE,
	INGAME,
}

export enum CoalitionColors {
	CETUS = "3AA2DB",
	PYXIS = "B73188",
	VELA = "E52A2D",
}

export const roles = [...Array(Object.keys(Role).length / 2).keys()];