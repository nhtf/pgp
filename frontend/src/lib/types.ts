import type { Access, Role, Status, Gamemode, Subject, Action } from "./enums";

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

export type Team = {
	id: number,
	name: string,
};

export type Player = {
	team: Team,
};

export type GameRoomMember = Member & {
	player: Player | null,
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

export type ChatRoom = Room & {
	// messages: Message[],
};

export type GameRoom = Room & {
	state: GameState,
	gamemode: Gamemode,
	teamsLocked: boolean,
	teams: Team[],
};

export type GameState = {
	teamsLocked: boolean,
	gamemode: Gamemode,
	teams: Team[],
}

export type Invite = {
	id: number,
	date: Date,
	from: User,
	to: User,
	room: Room | undefined,
	type: string
};

export type UpdatePacket = {
	subject: Subject,
	action: Action,
	id: number,
	value?: any,
}

export type RoomDTO = {
	name?: string,
	password?: string,
	is_private?: boolean,
}