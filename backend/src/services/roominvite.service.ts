import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { RoomInvite } from "src/entities/RoomInvite";
import type { Room } from "src/entities/Room";
import type { User } from "src/entities/User";

interface IDObject {
	id: number;
}

interface InviteInfo {
	from: User | number;
	to: User | number;
	room: Room | number;
}

function get_object<T extends IDObject>(obj: T | number): T {
	if (typeof obj === "number")
		return { id: obj } as T;
	return obj;
}

function get_id<T extends IDObject>(obj: T | number): number {
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

	async create(...invites: InviteInfo[]): Promise<RoomInvite[]> {
		const list : RoomInvite[] = [];
		for (const invite of invites) {
			const room_invite = new RoomInvite();

			room_invite.from = get_object(invite.from);
			room_invite.to = get_object(invite.to);
			room_invite.room = get_object(invite.room);
			list.push(room_invite);
		}
		return list;
	}

	async remove(...invite: RoomInvite[]): Promise<void> {
		await this.invite_repo.remove(invite);
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
		return await this.invite_repo.find({
			where: {
				from: {
					id: get_id(where?.from),
				},
				to: {
					id: get_id(where?.to),
				},
				room: {
					id: get_id(where?.room),
				},
			},
			relations: {
				from: true,
				to: true,
				room: true,
			},
		});
	}
}
