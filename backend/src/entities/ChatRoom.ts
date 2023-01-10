import { User } from './User';
import { RoomInvite } from './RoomInvite';
import { Message } from './Message';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Exclude, Expose, Transform } from 'class-transformer';
import { classToPlain } from 'class-transformer';
import { Access } from '../Access';

@Entity()
export class ChatRoom {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		default: 'null'
	})
	name: string;

	@Exclude()
	@Column({
		nullable: true
	})
	access: Access;

	@Exclude()
	@Column({
		   nullable: true
	})
	password: string | null;

	@Exclude()
	@ManyToOne(() => User, (user) => user.owned_chat_rooms)
	owner: Promise<User>;

	@Exclude()
	@ManyToMany(() => User, (user) => user.admin_chat_rooms)
	@JoinTable()
	admins: Promise<User[]>;

	@Exclude()
	@ManyToMany(() => User, (user) => user.all_chat_rooms)
	@JoinTable()
	members:  Promise<User[]>;

	@Exclude()
	@OneToMany(() => RoomInvite, (invite) => invite.room)
	invites: Promise<RoomInvite[]>;

	@OneToMany(() => Message, (message) => message.room)
	messages: Promise<Message[]>;

	@Expose()
	get has_password(): boolean {
		return this.password !== null;
	}

	async has_member(user: User): Promise<boolean> {
		return !!((await this.members).find((current: User) => current.user_id === user.user_id));
	}

	async add_member(user: User) {
		const room_members = await this.members;
		if (room_members)
			room_members.push(user);
		else
			this.members = Promise.resolve([user]);
	}

	async add_admin(user: User) {
		const room_admins = await this.admins;
		if (room_admins)
			room_admins.push(user);
		else
			this.admins = Promise.resolve([user]);
	}

	async serialize() {
		return { ...classToPlain(this), owner: await this.owner, admins: await this.admins, members: await this.members };
	}
}
