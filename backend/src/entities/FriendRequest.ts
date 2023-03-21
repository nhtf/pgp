import { ChildEntity } from "typeorm";
import { Expose } from "class-transformer"
import { Invite } from "./Invite";

@ChildEntity()
export class FriendRequest extends Invite {

	@Expose()
	get type(): string {
		return "Friend";
	}
}
