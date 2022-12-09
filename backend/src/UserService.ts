import { Injectable, Inject } from '@nestjs/common';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany} from 'typeorm';
import { ChatRoom } from './Chat';
import { DEFAULT_AVATAR } from './vars';
import { User } from './entities/User';

@Injectable()
export class UserService {
	constructor(@Inject('USER_REPO') private readonly repo: Repository<User>) {}

	async get_user(where: FindOptionsWhere<User>): Promise<User | undefined> {
		const result = await this.repo.findOne({
			where: where,
			relations: {
				friends: true,
			}
		});
		if (result == null)
			return undefined;
		return result;
	}

	async get_user_by_name(username: string): Promise<User | undefined> {
		const result = await this.repo.findOne({
			where: {
				username: username
			}
		});
		if (result == null)
			return undefined;
		return result;
	}

	async save(users: User[]) {
		return await this.repo.save(users);
	}

	async exists(user_id: number): Promise<boolean> {
		return (await this.get_user({ user_id: user_id })) !== null;
	}
}
