import {
	ManyToOne,
	ChildEntity,
} from "typeorm";
import { Exclude, Expose, instanceToPlain } from "class-transformer";
import { Room } from "./Room";
import { Invite } from "./Invite";

@ChildEntity()
export class RoomInvite extends Invite {
	@ManyToOne(() => Room, (room) => room.invites, { onDelete: "CASCADE", eager: true })
	room: Room;

	@Expose()
	get type(): string {
		return this.room?.type || "unknown";
	}
}
