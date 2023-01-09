import { Controller, Get, UseGuards, Req, Res, Put, Post, Query, HttpException, HttpStatus, Session } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthorizationCode, AccessToken } from 'simple-oauth2';
import * as session from 'express-session';
import * as rm from 'typed-rest-client/RestClient';
import { BearerCredentialHandler } from 'typed-rest-client/handlers/bearertoken';
import isAlphanumeric from 'validator/lib/isAlphanumeric';
import { SessionUtils, SessionObject } from '../SessionUtils';
import { User } from '../entities/User';
import { UserService } from '../UserService';
import { AuthLevel } from './AuthLevel';
import { AuthGuard } from './auth.guard';
import { IsAlphanumeric } from 'class-validator';
import { BACKEND_ADDRESS, FRONTEND_ADDRESS, DEFAULT_AVATAR } from '../vars';

interface result_dto {
	id: number;
	login: string;
}

class token_dto {
	@IsAlphanumeric()
	code: string;
}

@Controller('oauth')
export class AuthController {

	private readonly client = new AuthorizationCode({
		client: {
			id: process.env.CLIENT_ID,
			secret: process.env.CLIENT_SECRET,
		},
		auth: {
			tokenHost: 'https://api.intra.42.fr',
			authorizeHost: 'https://api.intra.42.fr',
		}
	});

	constructor(private readonly session_utils: SessionUtils,
		private readonly user_service: UserService) { }

	@Get('whoami')
	async amiloggedin(@Req() request: Request, @Res() response: Response) {
		if (request.session.access_token) {
			return response.status(200).json({
				user_id: request.session.user_id
			}).send();
		} else {
			return response.status(200).json({
				user_id: 'anonymous'
			}).send();
		}
	}

	@Get('login')
	async login(@Req() request: Request, @Res() response: Response) {
		const auth_uri = this.client.authorizeURL({
			redirect_uri: BACKEND_ADDRESS + '/oauth/callback',
			scope: 'public'
		});
		response.redirect(auth_uri);
		return response.send();
	}

	@Post('logout')
	async logout(@Session() session: SessionObject) {
		session.auth_level = AuthLevel.None;
		if (!this.session_utils.destroy_session(session))
			throw new HttpException('could not logout', HttpStatus.INTERNAL_SERVER_ERROR);
	}

	async get_access_token(code: string): Promise<AccessToken | undefined> {
		try {
			const access_token = await this.client.getToken({
				code: code,
				redirect_uri: BACKEND_ADDRESS + '/oauth/callback',
				scope: 'public'
			});
			return access_token;
		} catch (error) {
			throw new HttpException(error.output.payload.error, error.output.statusCode);
		}
	}

	async get_user_id(access_token: AccessToken): Promise<number | undefined> {
		let rest_client = new rm.RestClient('pgp', 'https://api.intra.42.fr',
			[new BearerCredentialHandler(access_token.token.access_token, false)]);
		const res = await rest_client.get<result_dto>('/v2/me');
		if (res.statusCode != 200) {
			console.error('received ' + res.statusCode + ' from intra when retrieving user id');
			return undefined;
		}

		const result = res.result;
		if (!result.id || !result.login) {
			console.error('did not properly receive user_id and/or login from intra');
			return undefined;
		}
		return result.id;
	}

	@Get('callback')
	async get_token(@Query() token: token_dto, @Req() request: Request, @Res() response: Response) {
		const access_token = await this.get_access_token(token.code);

		if (!await this.session_utils.regenerate_session(request.session))
			throw new HttpException('failed to create session', HttpStatus.SERVICE_UNAVAILABLE);

		const oauth_id = await this.get_user_id(access_token);
		if (oauth_id == undefined)
			throw new HttpException('bad gateway', HttpStatus.BAD_GATEWAY);

		let user = await this.user_service.get_user({ oauth_id: oauth_id });
		if (!user) {
			user = new User();
			user.oauth_id = oauth_id;
			user.auth_req = AuthLevel.OAuth;
			user.secret = undefined;
			user.username = undefined;
			user.has_avatar = false;
			await this.user_service.save([user]);
		}

		request.session.access_token = access_token.token.access_token;
		request.session.user_id = user.user_id;
		request.session.auth_level = AuthLevel.OAuth;

		this.session_utils.save_session(request.session);
		if (request.session.auth_level != user.auth_req)
			response.redirect(FRONTEND_ADDRESS + '/otp_verify');
		else
			response.redirect(FRONTEND_ADDRESS + '/profile');
	}
}
