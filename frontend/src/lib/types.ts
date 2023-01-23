export type Achievement = {
	name: string,
	icon: string,
	have: boolean,
	text: string[],
	level: number,
	progress: number,
	level_cost: number[],
}

export type Member = {
	user: User,
	role: Role,
}

export type User = {
	id: number,
	auth_req?: number,
	username: string,
	avatar: string,
	online: boolean,
	in_game: boolean,
	achievements?: Achievement[],
};

export type Message = {
	content: string,
	user: User,
};

export type Room = {
    id: number,
    name: string,
	is_private: boolean,
    members: Member[],
    invites: Invite[],
    messages: Message[],
	owner : User,
}

export type Invite = {
	id: number,
	data: Date,
	from: User,
	to: User,
	room: Room,
}

export enum Role {
	OWNER = "owner",
	ADMIN = "admin",
	MEMBER = "member",
}
