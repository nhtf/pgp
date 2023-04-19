import { ChildEntity } from "typeorm";
import { Member } from "./Member";
import { Exclude } from "class-transformer";
import { OneToMany, CreateDateColumn } from "typeorm"
import { Message } from "./Message"

@ChildEntity()
export class ChatRoomMember extends Member {
	@Exclude()
	@OneToMany(() => Message, (message) => message.member)
	messages: Message[];

	@CreateDateColumn({ type: "timestamptz" })
	mute: Date;

	get is_muted(): boolean {
		return this.mute > new Date;
	}

	get type(): string {
		return "ChatRoomMember";
	}
}
