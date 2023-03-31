import type { Access, Role, Status, Gamemode } from "./enums";
import type { Achievement } from "./types";
import { icon_path, gamemode_icons } from "./constants"

export class Entity {
	id: number;
}

export class User extends Entity {
	auth_req?: number;
	username: string;
	status: Status;
	avatar: string;
	activeRoomId: number | null;
	achievements?: Achievement[];
};

export class Room<U extends Member = Member> extends Entity {
    name: string;
	access: Access;
	type: "ChatRoom" | "GameRoom";
	joined: boolean;
	owner?: User;
	self?: U;

	get route(): string {
		return `/${this.nav}/${this.id}`;
	}

	get nav(): string {
		return this.type.replace("Room", "").toLowerCase();
	}

	get icon(): string | null {
		return null;
	}
};

export class ChatRoom extends Room<ChatRoomMember> {
	// messages: Message[];
};

export class GameRoom extends Room<GameRoomMember> {
	state?: GameState;

	get icon(): string | null {
		if (!this.state) {
			return null;
		}

		const icons = gamemode_icons[this.state.gamemode];
	
		return `${icon_path}/${icons.get(this.state.teams.length)!}`;
	}
};

export class GameState extends Entity {
	teamsLocked: boolean;
	gamemode: Gamemode;
	teams: Team[];
	roomId: number | null;
}

export class Member extends Entity {
	role: Role;
	userId: number;
	roomId: number;
	type: string;
};

export class ChatRoomMember extends Member {
	is_muted: boolean;
}

export class GameRoomMember extends Member {
	player: Player | null;
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

export class Invite extends Entity {
	date: Date;
	from: User;
	to: User;
	type: "ChatRoom" | "GameRoom" | "FriendRequest";
	room?: Room;
};

export type Embed = {
	digest: string;
	url: string;
	rich: boolean,
};

export class Message extends Entity {
	content: string;
	member: Member | null;
	memberId: number | null;
	created: number;
	embeds: Embed[];
	userId: number;
};
