import { Controller, UseGuards, Post, Body, Session, HttpException, HttpStatus,
		Injectable, CanActivate, ExecutionContext, HttpCode, Get, Query } from '@nestjs/common';
import { AuthGuard } from './auth/auth.guard';
import { Length, IsString } from 'class-validator';
import { UserService } from './UserService';
import { SessionObject } from './SessionUtils';
import { Request, Response } from 'express';

class UsernameDto {
	@IsString()
	@Length(1, 20)
	username: string;
}

@Injectable()
export class SetupGuard implements CanActivate {
	constructor(private readonly user_service: UserService) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const http = context.switchToHttp();
		const request = http.getRequest();
		const response = http.getResponse();
		if (request.session.user_id == undefined) {
			response.status(400).json('bad request');
			return false;
		}
		const user = await this.user_service.get_user(request.session.user_id);
		if (user.username == null) {
			response.status(403).json('no username set');
			return false;
		}
		return true;
	}
}

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {

	constructor(private readonly user_service: UserService) {}

	@Post('setup')
	@HttpCode(HttpStatus.CREATED)
	async setup(@Body() username_dto: UsernameDto, @Session() session: SessionObject) {
		const user = await this.user_service.get_user(session.user_id);
		if (user.username != null)
			throw new HttpException('already setup user', HttpStatus.FORBIDDEN);

		const other_user = await this.user_service.get_user_by_name(username_dto.username);
		if (other_user)
			throw new HttpException('username already taken', HttpStatus.BAD_REQUEST);
		user.username = username_dto.username;
		await this.user_service.save([user]);
	}

	@Post('reset')
	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async reset(@Session() session: SessionObject) {
		const user = await this.user_service.get_user(session.user_id);
		user.username = null;
		await this.user_service.save([user]);
	}

	@Get('whoami')
	@UseGuards(SetupGuard)
	async whoami(@Session() session: SessionObject) {
		const user = await this.user_service.get_user(session.user_id);
		return { username: user.username };
	}

	@Get('whois')
	async whois(@Query() username_dto: UsernameDto) {
		const user = await this.user_service.get_user_by_name(username_dto.username);
		if (!user)
			throw new HttpException('no user with such name', HttpStatus.NOT_FOUND);
		return { id: user.user_id, username: user.username };
	}
}
