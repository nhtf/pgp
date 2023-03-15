import type { Request, Response, NextFunction } from "express";
import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { User } from "src/entities/User";
import { Repository } from "typeorm"

@Injectable()
export class UserMiddleware implements NestMiddleware {
	constructor(@Inject("USER_REPO") private readonly userRepo: Repository<User>) {}

	async use(request: Request, response: Response, next: NextFunction) {
		const id = request?.session?.user_id;
	
		if (id) {
			request.user = await this.userRepo.findOneBy({ id });
		}
	
		next();
	}
}
