import type { Access, Role, Status, Gamemode } from "./enums";

export type Entity = {
	id: number,
}

export type User = {
	id: number,
	auth_req?: number,
	username: string,
	status: Status,
	avatar: string,
	in_game: boolean,
	activeMember?: GameRoomMember,
};

export type Room = {
    id: number,
    name: string,
	access: Access,
	type: "ChatRoom" | "GameRoom",
	owner?: User,
	joined?: boolean,
	self?: Member
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

export type Member = {
	id: number,
	user: User,
	role: Role,
	is_muted: boolean,
	userId: number,
	roomId: number,
	player?: Player,
};

export type GameRoomMember = Member & {
	player: Player | null,
};

export type Player = {
	team: Team,
};

export type Team = {
	id: number,
	name: string,
	score: number,
};

export type Invite = {
	id: number,
	date: Date,
	from: User,
	to: User,
	type: "Room" | "ChatRoom" | "GameRoom" | "Friend",
	room?: Room,
};

export type Embed = {
	digest: string;
	url: string;
	rich: boolean,
};

export type Message = {
	id: number,
	content: string,
	member: Member | null,
	memberId: number | null,
	created: number,
	embeds: Embed[],
	userId: number,
};
