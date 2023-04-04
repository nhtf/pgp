import { Repository, DataSource, In, DeleteQueryBuilder } from "typeorm";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Injectable, Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { Room } from "src/entities/Room";
import { Role } from "src/enums"

@Injectable()
export class UserService {
	constructor(
		@Inject("DATA_SOURCE") private readonly datasource: DataSource,
		@Inject("USER_REPO") private readonly user_repo: Repository<User>,
		@Inject("ROOM_REPO") private readonly room_repo: Repository<Room>,
		private readonly update_service: UpdateGateway,
	) {}

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

		// const friend_query = this.datasource.createQueryBuilder()
		// 	.delete()
		// 	.from("friend")
		// 	.where("false");
		// const block_query = this.datasource.createQueryBuilder()
		// 	.delete()
		// 	.from("block")
		// 	.where("false");

		// for (const user of users) {
		// 	friend_query.orWhere("userId_1 = :id", user);
		// 	friend_query.orWhere("userId_2 = :id", user);
		// 	block_query.orWhere("userId_1 = :id", user);
		// 	block_query.orWhere("userId_2 = :id", user);
		// }
	
		this.update_service.remove_users(...users);
		await this.removeFromJoinTableQuery("friend", ...users).execute();
		await this.removeFromJoinTableQuery("block", ...users).execute();
		await this.user_repo.remove(users);
	}

	removeFromJoinTableQuery(table: string, ...users: User[]): DeleteQueryBuilder<any> {
		return users.reduce((acc, user) => {
			acc.orWhere("userId_1 = :id", user);
			acc.orWhere("userId_2 = :id", user);
	
			return acc;
		}, this.datasource
			.createQueryBuilder()
			.delete()
			.from(table)
			.where("false")
		);
	}
}
