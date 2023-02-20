import { Inject, Injectable, NestMiddleware, BadRequestException } from "@nestjs/common";
import { Room } from "src/entities/Room";
import { validate_id } from "src/util";
import { Repository } from "typeorm";

@Injectable()
export class RoomMiddleware implements NestMiddleware {
	constructor(
		@Inject("ROOM_REPO")
		private readonly repo: Repository<Room>
	) {}

	//TODO use types for req and res
	async use(req: any, res: any, next: (error?: any) => void) {
		if (req.params.id) {
			let id: number;
		
			try {
				id = validate_id(req.params.id);
			} catch (error) {
				throw new BadRequestException(error.message);
			}
		
			req.room = await this.repo.findOne({
				relations: {
					members: {
						user: true
					},
					invites: true,
					banned_users: true,
				},
				where: {
					id: id,
				},
			});
		}
	
		next();
	}
}
