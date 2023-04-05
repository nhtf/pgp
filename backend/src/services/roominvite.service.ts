import type { Room } from "src/entities/Room";
import type { User } from "src/entities/User";
import { Injectable, Inject } from "@nestjs/common";
import { RoomInvite } from "src/entities/RoomInvite";
import { Repository, In } from "typeorm";

interface Entity {
	id: number;
}

interface InviteInfo {
	to: User;
	from: User;
	room: Room ;
}

function get_object<T extends Entity>(obj: T | number): T {
	if (typeof obj === "number")
		return { id: obj } as T;
	return obj;
}

function get_id<T extends Entity>(obj: T | number): number {
	if (obj == undefined)
		return undefined;
	if (typeof obj === "number")
		return obj;
	return obj.id;
}

@Injectable()
export class RoomInviteService {
	constructor(
		@Inject("ROOMINVITE_REPO")
		private readonly invite_repo: Repository<RoomInvite>,
	) {}

	async save(...invites: RoomInvite[]): Promise<RoomInvite[]> {
		return this.invite_repo.save(invites);
	}

	async remove(...invite: RoomInvite[]): Promise<void> {
		await this.invite_repo.remove(invite);
	}

	async create(...invites: InviteInfo[]): Promise<RoomInvite[]> {
		return invites.map(({ from, to, room }) => {
			const invite = new RoomInvite;

			invite.to = to;
			invite.from = from;
			invite.room = room;

			return invite;
		});
	}

	async remove_where(where: Partial<InviteInfo>): Promise<void> {
		const query = this.invite_repo
			.createQueryBuilder("invite")
			.delete()
			.from(RoomInvite);

		if (where.from)
			query.where("fromID = :from_id", { from_id: get_id(where.from) });
		if (where.to)
			query.andWhere("toID = :to_id", { to_id: get_id(where.to) });
		if (where.room)
			query.andWhere("roomID = :room_id", { room_id: get_id(where.room) });
		await query.execute();
	}

	async get(where?: Partial<InviteInfo>): Promise<RoomInvite[]> {
		return this.invite_repo.find({
			where: {
				from: {
					id: where?.from?.id,
				},
				to: {
					id: where?.to?.id,
				},
				room: {
					id: where?.room?.id,
				},
			},
			relations: {
				to: true,
				from: true,
				room: true,
			},
		});
	}

	async are_invited(room: Room, ...users: User[]): Promise<boolean> {
		const ids = users.map((user) => user.id);
		const invites = await this.invite_repo.findBy({
			room: {	id: room.id	},
			to: { id: In(ids) }
		})
	
		return invites.length > 0;
	}
}
