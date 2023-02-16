export type Achievement = {
	name: string,
	icon: string,
	have: boolean,
	text: string[],
	level: number,
	progress: number,
	level_cost: number[],
};

export type Member = {
	id: number,
	user: User,
	role: Role,
	is_muted: boolean,
};

export type User = {
	id: number,
	auth_req?: number,
	username: string,
	status: Status,
	avatar: string,
	in_game: boolean,
	achievements?: Achievement[],
	invites?: any[],
};

export type FriendRequest = {
	id: number,
	date: Date,
	from: User,
	to: User
};

export type Message = {
	content: string,
	member: Member,
	created: string,
};

export type Room = {
    id: number,
    name: string,
	access: Access,
	type: "ChatRoom" | "GameRoom",
	owner: User,
	joined?: boolean,	
};

export type GameRoom = Room & {
	gamemode: Gamemode,
};

export type ChatRoom = Room & {
	// messages: Message[],
};

export type Invite = {
	id: number,
	date: Date,
	from: User,
	to: User,
	room: Room | undefined,
	type: string
};

export interface UpdatePacket {
	subject: Subject;
	identifier: number;
	action: Action;
	value?: any;
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
	REGULAR,
	VR,
	MODERN
};

export enum Subject {
	USER,
	INVITE,
	FRIEND,
	ROOM,
	MEMBER,
}

export enum Action {
	ADD,
	SET,
	REMOVE,
}

export enum Status {
	OFFLINE,
	IDLE,
	ACTIVE,
}

export enum CoalitionColors {
	CETUS = "3AA2DB",
	PYXIS = "B73188",
	VELA = "E52A2D",
}