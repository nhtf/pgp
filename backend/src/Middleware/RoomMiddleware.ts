import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { Member } from "src/entities/Member";
import { Room } from "src/entities/Room";
import { parseId } from "src/util";

@Injectable()
export class RoomMiddleware implements NestMiddleware {
	async use(req: any, res: any, next: (error?: any) => void) {
		const id = req.params.id;
	
		if (id) { 
			req.room = await parseId(Room, id);

			console.log(req.room);
		}
	
		next();
	}
}
