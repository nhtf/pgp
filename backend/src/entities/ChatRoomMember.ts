import { ChildEntity } from "typeorm";
import { Member } from "./Member";
import { Exclude, Expose } from "class-transformer";
import { OneToMany, CreateDateColumn } from "typeorm"
import { Message } from "./Message"

@ChildEntity()
export class ChatRoomMember extends Member {
	@Exclude()
	@OneToMany(() => Message, (message) => message.member)
	messages: Message[];

	@Exclude()
	@CreateDateColumn()
	mute: Date;

	@Expose()
	get is_muted(): boolean {
		return this.mute > new Date;
	}

	get type(): string {
		return "ChatRoomMember";
	}
}
