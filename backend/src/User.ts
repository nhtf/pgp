import { Entity, PrimaryColumn, Column } from 'typeorm';
import { DEFAULT_AVATAR } from './vars';

export enum AuthLevel {
	None,
	OAuth,
	TWOFA
}

@Entity()
export class User {
	@PrimaryColumn()
	user_id: number;

	@Column()
	auth_req: AuthLevel;

	@Column({
		nullable: true
	})
	secret: string | undefined;

	@Column({
		nullable: true
	})
	username: string | undefined;

	//TODO make boolean
	@Column({
		   nullable: true
	})
	avatar: string;

}
