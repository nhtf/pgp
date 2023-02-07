import { Injectable, NestMiddleware } from "@nestjs/common";
import { Room } from "src/entities/Room";

@Injectable()
export class MemberMiddleware implements NestMiddleware {
	async use(req: any, res: any, next: (error?: any) => void) {
		const room: Room = req.room;
	
		if (room) {
			const index = room.users.findIndex((user) => user.id === req.user.id);

			if (index >= 0) {
				req.member = room.members[index];
			}
		}
	
		next();
	}
}
