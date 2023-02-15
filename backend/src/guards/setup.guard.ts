import { Injectable, Inject, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "src/entities/User";

@Injectable()
export class SetupGuard implements CanActivate {
	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const http = context.switchToHttp();
		const request = http.getRequest();
	
		if (!request.session?.user_id)
			throw new HttpException("bad request", HttpStatus.BAD_REQUEST);
	
		const user = await this.user_repo.findOneBy({
			id: request.session.user_id
		});
	
		if (!user.username)
			throw new HttpException("no username set", HttpStatus.FORBIDDEN);
	
		return true;
	}
}
