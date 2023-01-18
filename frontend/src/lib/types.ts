export type User = {
	id: number,
	auth_req?: number,
	username: string,
	avatar: string,
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