import { Room } from "./entities/Room";
import { User } from "./entities/User";
import { Member } from "./entities/Member";
import { Repository } from "typeorm";
import { Access } from "./Enums/Access";
import { dataSource } from "./app.module";

import { Controller } from "@nestjs/common";
import { Role } from "./Enums/Role";

class RoomService<T extends Room> { 
	repository: Repository<Room>;
	member_repo: Repository<Member>;

	constructor(private readonly type: (new () => T)) {
		this.repository = dataSource.getRepository(Room);
		this.member_repo = dataSource.getRepository(Member);
	}

	async find(room: number | Room) {
		if (typeof room === "number")
			return this.repository.findOneBy({ id: room });
		return Promise.resolve(room);
	}

	async find_member(user: User, room: Room): Promise<Member | null> {
		/*
		return this.member_repo.findOneBy({
			room: { id: room.id },
			user: { id: user.id }
		});
	   */
		return null;
	}

	async create(name: string, password?: string, is_private?: boolean) {
		if (await this.repository.findOneBy([{
				name: name,
				access: Access.PUBLIC
			},
			{
				name: name,
				access: Access.PROTECTED 
			}])) {
			throw new Error("room already exists");
		}
		const room = new this.type();

		room.name = name;
		room.is_private = is_private ?? false;
		if (!room.is_private)
			room.password = password;
		return this.repository.save(room);
	}

	async delete(executor: User, room: number | Room) {
		const target = await this.find(room);
		const member = await this.find_member(executor, target);
		if (!member && target.access === Access.PRIVATE)
			throw new Error("not found");
		else if (!member || member.role !== Role.OWNER)
			throw new Error("forbidden")
		return this.repository.remove(target);
	}
}

@Controller("test")
export class TestController {
	/*
	private readonly room_service: RoomService<GameRoom>;
	constructor(@Inject("GAMEROOM_REPO") private readonly game_repo: Repository<GameRoom>) {
		this.room_service = new RoomService<GameRoom>(GameRoom);
	}

	@Get()
	async yes() {
		return this.game_repo.find();
	}

	@Get('add')
	async add() {
		return await this.room_service.create("hallo");
	}
   */
}
