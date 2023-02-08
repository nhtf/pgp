import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { Member } from "src/entities/Member";
import { Room } from "src/entities/Room";
import { Repository } from "typeorm";

@Injectable()
export class MemberMiddleware implements NestMiddleware {
	constructor(
		@Inject("MEMBER_REPO")
		private readonly repo: Repository<Member>
	) {}
	async use(req: any, res: any, next: (error?: any) => void) {
		const room: Room = req.room;
	
		if (room) {
			req.member = await this.repo.findOne({
				relations: {
					room: true
				},
				where: {
					user: {
						id: req.user.id
					},
					room: {
						id: room.id,
					}
				}
			});
		}
	
		next();
	}
}

