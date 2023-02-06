import { User } from "./User";
import { ChildEntity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { Invite } from "./Invite";
import { instanceToPlain } from "class-transformer";

@ChildEntity()
export class FriendRequest extends Invite {

	get type(): string {
		return "Friend";
	}
}
