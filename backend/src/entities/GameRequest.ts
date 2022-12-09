import { User } from './User';
import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class GameRequest {
	@PrimaryGeneratedColumn()
	id!: number;

	@ManyToOne(() => User, (user) => user.sent_game_invite)
	from: Promise<User>;

	@ManyToOne(() => User, (user) => user.incoming_game_invite)
	to: Promise<User>;
}
