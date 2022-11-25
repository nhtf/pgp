import { Injectable } from '@nestjs/common';
import { User } from './User';
import { Repository } from 'typeorm';
import { data_source } from './main';

@Injectable()
export class UserService {
	private readonly repo: Repository<User> = data_source.getRepository(User);

	async get_user(user_id: number): Promise<User | undefined> {
		return await this.repo.findOneById(user_id);
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
		return (await this.get_user(user_id)) !== null;
	}
}
