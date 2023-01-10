import { User } from './User';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { classToPlain } from 'class-transformer';

@Entity()
export class FriendRequest {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	date: Date;

	@ManyToOne(() => User, (user) => user.sent_friend_requests)
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_friend_requests)
	to: Promise<User>;

	async serialize() {
		return {
			...classToPlain(this),
			from: await this.from,
			to: await this.to
		}
	}
}
