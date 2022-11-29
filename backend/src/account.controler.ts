import { Controller, UseGuards, Post, Body, Session, HttpException, HttpStatus,
	Injectable, CanActivate, ExecutionContext, HttpCode, Get, Query,
	Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from './auth/auth.guard';
import { Length, IsString, IsOptional, IsNumberString } from 'class-validator';
import { UserService } from './UserService';
import { SessionObject } from './SessionUtils';
import { Request, Response, Express } from 'express';
import * as sharp from 'sharp';
import { open, rm } from 'node:fs/promises';
import { finished } from 'node:stream';
import { join } from 'path';
import { AVATAR_DIR, DEFAULT_AVATAR, BACKEND_ADDRESS } from './vars';
import { User } from './User';

class UsernameDto {
	@IsString()
	@Length(1, 20)
	@IsOptional()
	username?: string;

	@IsNumberString()
	@IsOptional()
	user_id?: string;
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
		if (!user.username)
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
		user.avatar = null;
		await this.user_service.save([user]);
	}

	get_avatar_filename(user_id: number) {
		return user_id.toString() + '.jpg';
	}

	get_avatar_path(avatar: string): string {
		return BACKEND_ADDRESS + '/' + AVATAR_DIR + '/' + avatar;
	}

	async who(by: string | number) {
		const user = await this.user_service.get_user(by);
		if (!user)
			throw new HttpException('not found', HttpStatus.NOT_FOUND);
		const avatar = user.avatar ? this.get_avatar_filename(user.user_id) : DEFAULT_AVATAR;
		return { id: user.user_id, username: user.username, avatar: this.get_avatar_path(avatar) };
	}

	@Get('whoami')
	@UseGuards(SetupGuard)
	async whoami(@Session() session: SessionObject) {
		return await this.who(session.user_id);
	}

	@Get('whois')
	async whois(@Query() dto: UsernameDto) {
		if (!dto.username && !dto.user_id)
			throw new HttpException('bad request', HttpStatus.BAD_REQUEST);
		return await this.who(dto.username ?? Number(dto.user_id));
	}

	@Post('set_image')
	@UseGuards(SetupGuard)
	async set_image(@Session() session: SessionObject, @Req() request: Request, @Res() response: Response) {
		const user = await this.user_service.get_user(session.user_id);
		const avatar_path = join(AVATAR_DIR, this.get_avatar_filename(session.user_id));

		const transform = sharp().resize(200, 200).jpeg();
		const file = await open(avatar_path, 'w');
		const stream = file.createWriteStream();
		request.pipe(transform).pipe(stream);

		finished(transform, (error: Error) => {
			if (error) {
				response.status(HttpStatus.BAD_REQUEST).json("bad image");
			} else {
				response.status(HttpStatus.ACCEPTED);
				user.avatar = 'yes';
				this.user_service.save([user]);
			}
			stream.close();
			file.close();
			return response.send();
		});
	}
}
