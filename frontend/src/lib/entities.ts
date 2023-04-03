import type { Access, Role, Status, Gamemode } from "./enums";
import type { Achievement } from "./types";
import { icon_path, gamemode_icons } from "./constants"

export class Entity {
	id: number;
}

export class User extends Entity {
	username: string;
	avatar: string;
	status: Status;
	activeRoomId: number | null;
	auth_req?: number;

	achievements?: Achievement[];
};

export class Room<U extends Member = Member> extends Entity {
    name: string;
	access: Access;
	type: "ChatRoom" | "GameRoom";
	joined: boolean;
	ownerId?: number;

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
	gamemode: Gamemode;
	teamsLocked: boolean;
	roomId: number | null;

	teams: Team[];
}

export class Member extends Entity {
	role: Role;
	type: string;
	roomId: number;
	userId: number;
};

export class ChatRoomMember extends Member {
	is_muted: boolean;
}

export class GameRoomMember extends Member {
	player: Player | null;
};

export class Player extends Entity {
	teamId: number;
	userId: number;

	team: Team;
	user: User;
};

export class Team extends Entity {
	name: string;
	score: number;
	stateId: number;
	players: Player[];
};

export class Invite extends Entity {
	constructor() {
		super();
		this.room = new Room;
	}

	date: Date;
	type: "ChatRoom" | "GameRoom" | "FriendRequest";

	to: User;
	from: User;
	room?: Room;
};

export type Embed = {
	digest: string;
	url: string;
	rich: boolean,
};

export class Message extends Entity {
	content: string;
	created: number;
	embeds: Embed[];
	memberId: number | null;
	userId: number;
};
