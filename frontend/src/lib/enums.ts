export enum Subject {
	USER,
	INVITE,
	ROOM,
	MEMBER,
	FRIEND,
	MESSAGE,
	GAMESTATE,
	TEAM,
	BLOCK,
	PLAYER,
	ACHIEVEMENT,
	SCORE,
}

export enum Action {
	INSERT,
	UPDATE,
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