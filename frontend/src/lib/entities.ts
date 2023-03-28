import type { Access, Role, Status, Gamemode } from "./enums";
import type { Achievement } from "./types";

export type Entity = {
	id: number,
}

export type User = {
	id: number,
	auth_req?: number,
	username: string,
	status: Status,
	avatar: string,
	activeRoomId: number | null,
	achievements?: Achievement[],
};

export class Room<U extends Member = Member> {
    id: number;
    name: string;
	access: Access;
	type: "ChatRoom" | "GameRoom";
	joined: boolean;
	owner?: User;
	self?: U;
};

export class ChatRoom extends Room<ChatRoomMember> {
	// messages: Message[];
};

export class GameRoom extends Room<GameRoomMember> {
	state?: GameState;
};

export type GameState = {
	id: number,
	teamsLocked: boolean,
	gamemode: Gamemode,
	teams: Team[],
	roomId: number | null,
}

export type Member = {
	id: number,
	role: Role,
	userId: number,
	roomId: number,
};

export type ChatRoomMember = Member & {
	is_muted: boolean,
}

export type GameRoomMember = Member & {
	player: Player | null,
};

export type Player = Entity & {
	team: Team,
	teamId: number,
	user: User,
	userId: number,
};

export type Team = {
	id: number,
	name: string,
	score: number,
	stateId: number,
	players: Player[],
};

export type Invite = {
	id: number,
	date: Date,
	from: User,
	to: User,
	type: "ChatRoom" | "GameRoom" | "FriendRequest",
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
