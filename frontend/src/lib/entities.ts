import type { Access, Role, Status, Gamemode } from "./enums";
import type { Achievement } from "./types";
import { icon_path, gamemode_icons } from "./constants"
import { post, remove } from "$lib/Web";

export class Entity {
	id: number;
}

export class User extends Entity {
	username: string;
	avatar: string;
	status: Status;
	activeRoomId: number | null;
	auth_req?: number;
	queueing: boolean;
	is_dm: boolean;

	achievements?: Achievement[];
};

export class Room<T extends Member = Member> extends Entity {
    name: string;
	access: Access;
	type: "ChatRoom" | "GameRoom" | "DM";
	joined: boolean;

	owner?: User;
	self?: T;

	get route(): string {
		return `${this.nav}/${this.id}`;
	}

	get nav(): string {
		return `/${this.type.replace("Room", "").toLowerCase()}`;
	}

	get icon(): string | null {
		return null;
	}
};

export class ChatRoom extends Room<ChatRoomMember> {
	// messages: Message[];
};

export class GameRoom extends Room<GameRoomMember> {
	state?: Game;

	get icon(): string | null {
		if (!this.state) {
			return null;
		}

		const icons = gamemode_icons[this.state.gamemode];
	
		return `${icon_path}/${icons.get(this.state.teams.length)!}`;
	}
};

export class DMRoom extends Room {
	other?: User;
}

export class Game extends Entity {
	gamemode: Gamemode;
	teamsLocked: boolean;
	roomId: number | null;
	finished: boolean;
	ranked: boolean;

	teams: Team[];
}

export class Member extends Entity {
	role: Role;
	type: "ChatRoomMember" | "GameRoomMember";
	roomId: number;
	userId: number;
};

export class ChatRoomMember extends Member {
	mute: string;

	get is_muted(): boolean {
		return new Date(this.mute!) > new Date;
	}
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
	active: boolean;
};

export class Invite extends Entity {
	date: Date;
	type: "ChatRoomInvite" | "GameRoomInvite" | "FriendRequest";

	to: User;
	from: User;

	room?: Room;

	get accept(): Promise<any> {
		return Promise.resolve("Invite accept called");
	}

	get deny(): Promise<any> {
		return Promise.resolve("Invite deny called");
	}

};

export class RoomInvite extends Invite {
	constructor() {
		super();
		this.room = new Room;
	}

	room: Room;

	get accept(): Promise<any> {
		return post(`${this.room.route}/members`)
	}

	get deny(): Promise<any> {
		return remove(`${this.room.route}/invite/${this.id}`);
	}
} 

export class FriendRequest extends Invite {
	get accept(): Promise<any> {
		return post(`/user/me/friends`, { username: this.from.username });
	}

	get deny(): Promise<any> {
		return remove(`/user/me/friends/requests/${this.id}`);
	}
}

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

export class Stat extends Entity {
	username: string;
	gamemode: Gamemode;
	team_count: number;

	wins: number;
	losses: number;
	draws: number;
	rank: number;
}