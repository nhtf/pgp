import { Inject, HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { User } from "src/entities/User";
import { Repository } from "typeorm"

@Injectable()
export class UserMiddleware implements NestMiddleware {
	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
	) {}

	async use(req: any, res: any, next: (error?: any) => void) {
		if (!req.session.user_id) {
			throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
		}
	
		req.user = await this.user_repo.findOneBy({ id: req.session.user_id	});
	
		next();
	}
}
