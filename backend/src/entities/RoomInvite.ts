import {
	ManyToOne,
	ChildEntity,
} from "typeorm";
import { Expose } from "class-transformer"
import { Room } from "./Room";
import { Invite } from "./Invite";

@ChildEntity()
export class RoomInvite extends Invite {
	@ManyToOne(() => Room, (room) => room.invites, { cascade: true, eager: true, onDelete: "CASCADE" })
	room: Room;

	@Expose()
	get type(): string {
		return this.room?.type ?? "unknown";
	}
}
