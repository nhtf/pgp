import { Exclude, Expose } from "class-transformer";
import { ChildEntity, OneToMany } from "typeorm";
import { Message } from "./Message";
import { Room } from "./Room";

@ChildEntity()
export class DMRoom extends Room {
	@Exclude()
	@OneToMany(() => Message, (message) => message.room)
	messages: Message[];

	@Expose()
	get type(): string {
		return "DM";
	}
}
