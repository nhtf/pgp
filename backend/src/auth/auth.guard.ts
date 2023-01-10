import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { dataSource } from '../app.module';
import * as session from 'express-session';
import { User} from '../entities/User';

@Injectable()
export class AuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		if (request.session.user_id == undefined)
			return false;
		const user = await dataSource.getRepository(User).findOneBy({ user_id: request.session.user_id });
		if (!user)
			return false;
		return user.auth_req === request.session.auth_level;
	}
}
