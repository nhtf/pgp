import { Controller, Post, Req, UseGuards, Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Body, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { authenticator } from 'otplib';
import * as session from 'express-session';
import { SessionUtils } from '../SessionUtils';
import { UserService } from '../UserService';
import { AuthLevel } from '../User';
import { Length, IsNumberString } from 'class-validator';

@Injectable()
class OAuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		let response = context.switchToHttp().getResponse();
		if (request.session.access_token === undefined) {
			response.status(401).json('unauthorized');
			return false;
		}
		return true;
	}
}

class OtpDto { 
	@Length(6, 6)
	@IsNumberString()
	otp: string
}

@Controller('otp')
export class TotpController {
	constructor(private readonly session_utils: SessionUtils,
			   private readonly user_service: UserService) { }

	async save_session(session: session.Session): Promise<boolean> {
		const promise = new Promise((resolve: (value: boolean) => void, reject) => {
			session.save((error) => {
				if (error)
					reject(error);
				else
					resolve(true);
			});
		});
		try {
			return await promise;
		} catch (error) {
			console.error('unable to save session: ' + error);
			return false;
		}
	}

	@Post('setup')
	@HttpCode(HttpStatus.ACCEPTED)
	@UseGuards(OAuthGuard)
	async setup(@Req() request: Request) {
		if (request.session.secret)
			throw new HttpException('already requested otp setup', HttpStatus.TOO_MANY_REQUESTS);
		const user = await this.user_service.get_user(request.session.user_id);
		if (user.auth_req === AuthLevel.TWOFA)
			throw new HttpException('already setup 2fa', HttpStatus.FORBIDDEN);
		
		//https://www.rfc-editor.org/rfc/rfc4226 section 4
		const secret = authenticator.generateSecret(20);

		request.session.secret = secret;
		if (!this.save_session(request.session))
			throw new HttpException('unable to save session', HttpStatus.SERVICE_UNAVAILABLE);
		return { secret: secret };
	}

	async authenticate(otp: string, secret: string, session: session.Session & Partial<session.SessionData>): Promise<void> {
		if (!authenticator.check(otp, secret))
			throw new HttpException('invalid otp', HttpStatus.CONFLICT);

		const access_token = session.access_token;
		const user_id = session.user_id;

		// it might be needed to save the session with the save_session() function
		if (!await this.session_utils.regenerate_session(session))
			throw new HttpException('unable to create session', HttpStatus.INTERNAL_SERVER_ERROR);

		session.access_token = access_token;
		session.user_id = user_id;
		session.auth_level = AuthLevel.TWOFA;
	}

	@Post('setup_verify')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(OAuthGuard)
	async setup_verify(@Body() otp_dto: OtpDto, @Req() request: Request) {
		if (!request.session.secret)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		let session = request.session;
		const secret = session.secret;

		await this.authenticate(otp_dto.otp, secret, session);

		let user = await this.user_service.get_user(session.user_id);
		user.auth_req = AuthLevel.TWOFA;
		user.secret = secret;
		await this.user_service.save([user]);
	}

	@Post('verify')
	@HttpCode(HttpStatus.OK)
	@UseGuards(OAuthGuard)
	async verify(@Body() otp_dto: OtpDto, @Req() request: Request) {
		if (request.session.secret)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);
		let session = request.session;

		const user = await this.user_service.get_user(session.user_id);
		if (user.auth_req !== AuthLevel.TWOFA)
			throw new HttpException('2fa not setup', HttpStatus.FORBIDDEN);
		const secret = user.secret;

		await this.authenticate(otp_dto.otp, secret, session);
	}
}
