import { Exclude, instanceToPlain } from "class-transformer";
import { ChildEntity, OneToMany } from "typeorm";
import { Message } from "./Message";
import { Room } from "./Room";

@ChildEntity()
export class ChatRoom extends Room {
	@Exclude()
	@OneToMany(() => Message, (message) => message.room)
	messages: Promise<Message[]>;

	async serialize() {
		return {
			...super.serialize(),
			...instanceToPlain(this),
		}
	}
}
