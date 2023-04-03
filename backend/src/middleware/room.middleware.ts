import { Inject, Injectable, NestMiddleware, BadRequestException } from "@nestjs/common";
import { Request, Response, NextFunction } from "express"
import { Room } from "src/entities/Room";
import { validate_id } from "src/util";
import { Repository } from "typeorm";

@Injectable()
export class RoomMiddleware implements NestMiddleware {
	constructor(@Inject("ROOM_REPO") private readonly repo: Repository<Room>) {}

	async use(req: any, res: Response, next: NextFunction) {
		console.log(req.params.id);
		if (req.params.id) {
			try {
				const id = validate_id(req.params.id);
			
				req.room = await this.repo.findOneBy({ id });
			} catch (error) {
				throw new BadRequestException(error.message);
			}
		
		}
	
		next();
	}
}
