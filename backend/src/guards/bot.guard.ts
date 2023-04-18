import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
export class HumanGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const user = context.switchToHttp().getRequest().user;
		return user && !user.is_bot;
	}
}
