export enum Access {
	PUBLIC,
	PROTECTED,
	PRIVATE,
}

export enum Action {
	INSERT,
	UPDATE,
	REMOVE,
}

export enum AuthLevel {
	None,
	OAuth,
	TWOFA,
}

export enum Gamemode {
	CLASSIC,
	VR,
	MODERN,
}

export enum Role {
	MEMBER,
	ADMIN,
	OWNER,
}

export enum Status {
	OFFLINE,
	IDLE,
	ACTIVE,
	INGAME,
}

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
}
