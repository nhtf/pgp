import { User } from "./User";
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { instanceToPlain } from "class-transformer";

@Entity()
export class FriendRequest {
	@PrimaryGeneratedColumn()
	id!: number;

	@CreateDateColumn({ type: 'timestamptz' })
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_friend_requests, { onDelete: "CASCADE" })
	from: User;

	@ManyToOne(() => User, (user) => user.incoming_friend_requests, { onDelete: "CASCADE" })
	to: User;
}
