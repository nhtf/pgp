import {
	ManyToOne,
	ChildEntity,
} from "typeorm";
import { Exclude, instanceToPlain } from "class-transformer";
import { Room } from "./Room";
import { Invite } from "./Invite";

@ChildEntity()
export class RoomInvite extends Invite {
	@Exclude()
	@ManyToOne(() => Room, (room) => room.invites, { onDelete: "CASCADE" })
	room: Promise<Room>;

	async serialize() {
		return {
			...await super.serialize(),
			...instanceToPlain(this),
			room: await this.room,
		}
	}
}
