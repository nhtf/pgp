import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { Member } from "src/entities/Member";
import { Room } from "src/entities/Room";
import { parseId } from "src/util";

@Injectable()
export class RoomMiddleware implements NestMiddleware {
	async use(req: any, res: any, next: (error?: any) => void) {
		const id = req.params.id;
	
		if (id) { 
			console.log(id);
			const room = await parseId(Room, id);
			console.log(room);
			const members = await room.members;
			console.log(members);
			const member = await members.find(async (member: Member) => (await member.user).id === req.user.id);

			if (!member) {
				if (room.is_private) {
					throw new HttpException("Room not found", HttpStatus.NOT_FOUND);
				}

				throw new HttpException("Not a member", HttpStatus.FORBIDDEN);
			}

			req.room = await room.serialize();
			req.member = member;

			console.log(req.room);
			console.log(req.member);
		}
	
		next();
	}
}
