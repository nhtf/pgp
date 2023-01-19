export type Achievment = {
	name: string,
	icon: string,
	have: boolean,
	text: string,
	level: number,
}

export type User = {
	id: number,
	auth_req?: number,
	username: string,
	avatar: string,
	online: boolean,
	in_game: boolean,
	achievments?: Achievment[],
};

export type SerializedMessage = {
	content: string,
	user: User,
};

export type SerializedRoom = {
    id: number,
    name: string,
    owner: User,
    admins: User[],
    members: User[],
    invites: Invite[],
    messages: SerializedMessage[],
}

export type Invite = {
	id: number,
	data: Date,
	from: User,
	to: User,
	room: SerializedRoom,
}

export enum Role {
	OWNER = "owner",
	ADMIN = "admin",
	MEMBER = "member",
}
