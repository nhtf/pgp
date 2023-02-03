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
};

export type User = {
	id: number,
	auth_req?: number,
	username: string,
	avatar: string,
	status: string,
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
	user: User,
	member: Member,
};

export type Room = {
    id: number,
    name: string,
	access: Access,
	is_private: boolean,
	type: string,
	owner: User,
};

export type Gameroom = Room & {
	gamemode: Gamemode;
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
	identifier?: number;
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
};

export enum Subject {
	USER,
	INVITES,
	REQUESTS,
	FRIENDS,
	STATUS,
	AVATAR,
}

export enum Action {
	SET,
	ADD,
	REMOVE,
}
