import {
	ManyToOne,
	ChildEntity,
} from "typeorm";
import { Room } from "./Room";
import { Invite } from "./Invite";

@ChildEntity()
export class RoomInvite extends Invite {
	@ManyToOne(() => Room, (room) => room.invites, { cascade: true, eager: true, onDelete: "CASCADE" })
	room: Room;

	get type(): string {
		return this.room?.type || "unknown";
	}
}
