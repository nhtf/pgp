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
	id: number,
	user: User,
	role: Role,
}

export type User = {
	id: number,
	auth_req?: number,
	username: string,
	avatar: string,
	status: string,
	in_game: boolean,
	achievements?: Achievement[],
};

export type Message = {
	content: string,
	member: Member,
};

export type ChatRoom = {
    id: number,
    name: string,
	access: Access,
	is_private: boolean,
    members: Member[],
    invites: Invite[],
    messages: Message[],
	owner : User,
}

export type Invite = {
	id: number,
	date: Date,
	from: User,
	to: User,
	Chatroom: ChatRoom,
}

export enum Role {
	MEMBER,
	ADMIN,
	OWNER,
}

export enum Access {
	PUBLIC,
	PROTECTED,
	PRIVATE,
}
