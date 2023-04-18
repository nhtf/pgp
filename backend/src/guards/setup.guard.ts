import { Injectable, Inject, CanActivate, ExecutionContext } from "@nestjs/common";
import { Repository } from "typeorm";
import { User } from "src/entities/User";

@Injectable()
export class SetupGuard implements CanActivate {
	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		return request.user && request.user.username;
	}
}
