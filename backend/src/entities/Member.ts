import { Column, Entity, RelationId, ManyToOne,PrimaryGeneratedColumn, AfterInsert, BeforeRemove,TableInheritance, AfterUpdate } from "typeorm";
import { Room } from "./Room";
import { Role } from "src/enums/Role";
import { User } from "./User";
import { Exclude, instanceToPlain } from "class-transformer";
import { Subject } from "src/enums/Subject";
import { Action } from "src/enums/Action";
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

	send_update(action: Action = Action.SET) {
		UpdateGateway.instance.send_update({
			subject: Subject.MEMBER,
			id: this.id,
			action,
			value: instanceToPlain(this),
		}, ...(this.room?.users || []));
	}

	@AfterInsert()
	afterInsert() {
		this.send_update(Action.ADD);
	}

	@AfterUpdate()
	afterUpdate() {
		this.send_update(Action.SET);
	}

	@BeforeRemove()
	beforeRemove() {
		this.send_update(Action.REMOVE);
	}
}
