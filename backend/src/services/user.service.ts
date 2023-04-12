import { Repository, DataSource, In, DeleteQueryBuilder } from "typeorm";
import { UpdateGateway } from "src/gateways/update.gateway";
import { FriendRequest } from "src/entities/FriendRequest"
import { Injectable, Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { Room } from "src/entities/Room";
import { Role } from "src/enums"

@Injectable()
export class UserService {
	constructor(
		@Inject("DATA_SOURCE") private readonly datasource: DataSource,
		@Inject("INVITE_REPO") private readonly invite_repo: Repository<FriendRequest>,
		@Inject("USER_REPO") private readonly user_repo: Repository<User>,
		@Inject("ROOM_REPO") private readonly room_repo: Repository<Room>,
		private readonly update_service: UpdateGateway,
	) { }

	async get(...ids: number[]) {
		return this.user_repo.findBy({ id: In(ids) });
	}

	async get_by_username(username: string) {
		return this.user_repo.findOneBy({ username });
	}

	async remove(...users: User[]) {
		const ids = users.map((user) => user.id);
		const rooms = await this.room_repo.findBy({
			members: {
				role: Role.OWNER,
				user: {
					id: In(ids)
				}
			},
		});

		await this.room_repo.remove(rooms);

		this.update_service.remove_users(...users);
		await this.removeFromJoinTableQuery("friend", ...users).execute();
		await this.removeFromJoinTableQuery("block", ...users).execute();
		await this.user_repo.remove(users);
	}

	removeFromJoinTableQuery(table: string, ...users: User[]): DeleteQueryBuilder<any> {
		const ids = users.map((user) => user.id);
	
		return this.datasource.createQueryBuilder()
			.delete()
			.from(table)
			.where("userId_1 IN (:...ids)", { ids })
			.orWhere("userId_2 IN (:...ids)", { ids });
	}

	async permute(first: User, second: User, fun: (f: User, s: User) => Promise<void>) {
		await fun(first, second);
		await fun(second, first);
	}

	async enqueue(user: Partial<User>) {
		await this.user_repo.save({ id: user.id, queueing: true });
	}

	async dequeue(user: Partial<User>) {
		await this.user_repo.save({ id: user.id, queueing: false });
	}
}
