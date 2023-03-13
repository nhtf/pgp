import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express"
import { Member } from "src/entities/Member";
import { User } from "src/entities/User";
import { Room } from "src/entities/Room";
import { Repository } from "typeorm";

@Injectable()
export class MemberMiddleware implements NestMiddleware {
	constructor(@Inject("MEMBER_REPO") private readonly memberRepo: Repository<Member>) {}
	async use(req: any, res: Response, next: NextFunction) {
		const user: User = req.user;
		const room: Room = req.room;
	
		if (user && room) {
			req.member = await this.memberRepo.findOne({
				where: {
					user: {
						id: user.id
					},
					room: {
						id: room.id
					}
				},
				relations: {
					room: {
						members: {
							user: true,
						}
					}
				}
			});
		}
	
		next();
	}
}

