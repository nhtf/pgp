import { User } from "./User";
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { instanceToPlain } from "class-transformer";

@Entity()
export class FriendRequest {
	@PrimaryGeneratedColumn()
	id!: number;

	@CreateDateColumn()
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_friend_requests, { onDelete: "CASCADE" })
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_friend_requests, { onDelete: "CASCADE" })
	to: Promise<User>;

	async serialize() {
		return {
			...instanceToPlain(this),
			from: await this.from,
			to: await this.to,
		};
	}
}
