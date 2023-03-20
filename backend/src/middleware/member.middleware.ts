import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express"
import { Member } from "src/entities/Member";
import { User } from "src/entities/User";
import { Room } from "src/entities/Room";
import { Repository } from "typeorm";

@Injectable()
export class MemberMiddleware implements NestMiddleware {
	constructor(@Inject("MEMBER_REPO") private readonly memberRepo: Repository<Member>) {}
	async use(request: Request & any, res: Response, next: NextFunction) {
		const user: User = request.user;
		const room: Room = request.room;
	
		if (user && room) {
			request.member = await this.memberRepo.findOneBy({ user: { id: user.id }, room: { id: room.id } });
		}
	
		next();
	}
}

