import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../UserService';
import * as session from 'express-session';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly user_service: UserService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		if (request.session.access_token == undefined)
			return false;
		const user = await this.user_service.get_user(request.session.user_id);
		return user.auth_req === request.session.auth_level;
	}
}
