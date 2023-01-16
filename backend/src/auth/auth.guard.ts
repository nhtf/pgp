import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { dataSource } from '../app.module';
import { User } from '../entities/User';

export async function authorize(session): Promise<boolean> {
		if (session.user_id == undefined) return false;
		const user = await dataSource
			.getRepository(User)
			.findOneBy({ user_id: session.user_id });
		if (!user) return false;
		return user.auth_req === session.auth_level;
}

@Injectable()
export class AuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		return authorize(request.session);
		/*
		if (request.session.user_id == undefined) return false;
		const user = await dataSource
			.getRepository(User)
			.findOneBy({ user_id: request.session.user_id });
		if (!user) return false;
		return user.auth_req === request.session.auth_level;
		*/
	}
}
