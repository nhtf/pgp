import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Exclude } from "class-transformer";
import { Message } from "./Message";

@Entity()
export class Embed {
	@Exclude()
	@PrimaryGeneratedColumn()
	id: number;

	@Exclude()
	@ManyToOne(() => Message, (message) => message.embeds)
	message: Message;

	@Column()
	url: string;

	@Column()
	digest: string;
}
