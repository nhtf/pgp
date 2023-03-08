import { Column, Entity, RelationId, ManyToOne,PrimaryGeneratedColumn, TableInheritance } from "typeorm";
import { Room } from "./Room";
import { User } from "./User";
import { Exclude, instanceToPlain } from "class-transformer";
import { Action, Role, Subject } from "src/enums";
import { UpdateGateway } from "src/gateways/update.gateway";

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Member {
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@ManyToOne(() => User, (user) => user.members, { onDelete: "CASCADE" })
	user: User;

	@RelationId((member: Member) => member.user)
	userId: number;

	// @Exclude()
	@ManyToOne(() => Room, { onDelete: "CASCADE", cascade: ["insert", "update"] })
	room: Room;

	@RelationId((member: Member) => member.room)
	roomId: number;

	@Column({
		type: "enum",
		enum: Role,
		default: Role.MEMBER,
	})
	role: Role;

	get type(): string {
		return "Member";
	}

	send_update(value: any = instanceToPlain(this), action: Action = Action.SET) {
		UpdateGateway.instance.send_update({
			subject: Subject.MEMBER,
			id: this.id,
			action,
			value,
		}, ...(this.room?.users || []));
	}
}
