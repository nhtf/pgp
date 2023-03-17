import type { Request, Response, NextFunction } from "express";
import { Inject, Injectable, NestMiddleware, BadRequestException } from "@nestjs/common";
import { User } from "src/entities/User";
import { Repository } from "typeorm"
import isBase64 from "validator/lib/isBase64";
import isJSON from "validator/lib/isJSON";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { AuthDTO } from "src/util";

@Injectable()
export class UserMiddleware implements NestMiddleware {
	constructor(@Inject("USER_REPO") private readonly userRepo: Repository<User>) {}

	async use(request: Request, response: Response, next: NextFunction) {
		let id = request.session?.user_id;
	
		if (request.headers?.authorization) {
			const auth = request.headers.authorization;
			if (!isBase64(auth))
				throw new BadRequestException("Invalid key");

			const info = Buffer.from(auth, "base64").toString();
			if (!isJSON(info))
				throw new BadRequestException("Invalid key");

			const dto = plainToClass(AuthDTO, JSON.parse(info));
			if ((await validate(dto)).length !== 0)
				throw new BadRequestException("Invalid key");
		
			id = dto.id;
		}
	
		if (id) {
			request.user = await this.userRepo.findOneBy({ id });
		}
	
		next();
	}
}
