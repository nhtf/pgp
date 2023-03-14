import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import type { User } from "src/entities/User";

@Injectable()
export class HumanGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const user = context.switchToHttp().getRequest().user;
		if (!user)
			return false;

		if (user.key === undefined || user.key === null)
			return true;
		return false;
	}
}
