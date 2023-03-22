import { Injectable, Inject } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { User } from "src/entities/User";
import { Room } from "src/entities/Room";
import { Member } from "src/entities/Member";
import { IRoomService } from "src/services/room.service";
import { UpdateGateway } from "src/gateways/update.gateway";

@Injectable()
export class UserService {
	constructor(
		@Inject("DATA_SOURCE") private readonly datasource: DataSource,
		@Inject("USER_REPO") private readonly user_repo: Repository<User>,
		@Inject("ROOM_PGPSERVICE") private readonly room_service: IRoomService<Room, Member>,
		private readonly update_service: UpdateGateway,
	) {}

	async remove(...users: User[]) {
		const rooms = (await Promise.all(users.map(async (user) => { 
			return await this.room_service.owned_rooms(user);
		}))).flat();
	
		await this.room_service.destroy(...rooms);

		const friend_query = this.datasource.createQueryBuilder()
			.delete()
			.from("Friend");
		const block_query = this.datasource.createQueryBuilder()
			.delete()
			.from("Block");

		let first = true;
		for (const user of users) {
			if (first) {
				friend_query.where("userId_1 = :id", user);
				block_query.where("userId_1 = :id", user);
			} else {
				friend_query.orWhere("userId_1 = :id", user);
				block_query.orWhere("userId_1 = :id", user);
			}
			friend_query.orWhere("userId_2 = :id", user);
			block_query.orWhere("userId_2 = :id", user);
			first = false;
			this.update_service.remove_user(user);
		}
		await friend_query.execute();
		await block_query.execute();
		await this.user_repo.remove(users);
	}
}
