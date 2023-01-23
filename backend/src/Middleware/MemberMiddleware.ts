import { Injectable, NestMiddleware } from "@nestjs/common";
import { Room } from "src/entities/Room";
import { User } from "src/entities/User";

@Injectable()
export class MemberMiddleware implements NestMiddleware {
	async use(req: any, res: any, next: (error?: any) => void) {
		const room: Room = req.room;
	
		if (room) {
			const members = await room.members;
			const users = await Promise.all(members.map((member) => member.user));
			const index = users.findIndex((user) => user.id === req.user.id);

			if (index >= 0) {
				req.member = members[index];
			}
		}
	
		next();
	}
}
