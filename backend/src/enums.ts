export enum Access {
	PUBLIC,
	PROTECTED,
	PRIVATE,
}

export enum Action {
	ADD,
	SET,
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
	MODERN4P
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
	SCORE,
}
