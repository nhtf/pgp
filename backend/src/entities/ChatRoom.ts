import { Exclude, Expose } from "class-transformer";
import { ChildEntity, OneToMany, Column } from "typeorm";
import { Message } from "./Message";
import { Room } from "./Room";

@ChildEntity()
export class ChatRoom extends Room {
	@Exclude()
	@OneToMany(() => Message, (message) => message.room)
	messages: Message[];

	@Exclude()
	@Column({ default: false })
	is_dm: boolean;

	@Expose()
	get type(): string {
		if (this.is_dm)
			return "DM";
		return "ChatRoom";
	}
}
