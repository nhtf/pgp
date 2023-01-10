import { Controller, Post, Req, UseGuards, Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Body, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { authenticator } from 'otplib';
import * as session from 'express-session';
import { SessionUtils, SessionObject } from '../SessionUtils';
import { UserService } from '../UserService';
import { AuthLevel } from './AuthLevel';
import { Length, IsNumberString } from 'class-validator';
import { AuthGuard } from './auth.guard';
import * as qrcode from 'qrcode';

@Injectable()
class OAuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		let response = context.switchToHttp().getResponse();
		if (request.session.access_token === undefined || request.session.auth_level !== AuthLevel.OAuth) {
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

	@Post('setup')
	@HttpCode(HttpStatus.ACCEPTED)
	@UseGuards(OAuthGuard)
	async setup(@Req() request: Request) {
		let session = request.session;
		/*
		if (session.secret)
			throw new HttpException('already requested otp setup', HttpStatus.TOO_MANY_REQUESTS);
		*/
		const user = await this.user_service.get_user({ user_id: session.user_id });
		if (user.auth_req === AuthLevel.TWOFA)
			throw new HttpException('already setup 2fa', HttpStatus.FORBIDDEN);

		//https://www.rfc-editor.org/rfc/rfc4226 section 4
		const secret = authenticator.generateSecret(20);

		session.secret = secret;
		if (!this.session_utils.save_session(session))
			throw new HttpException('unable to save session', HttpStatus.SERVICE_UNAVAILABLE);

		const otpauth = authenticator.keyuri('username', 'pgp', secret);
		const promise = new Promise((resolve: (value: string) => void, reject) => {
			qrcode.toDataURL(otpauth, (error, image_url) => {
				if (error) 
					reject(error);
				else
					resolve(image_url);
			});
		});

		let qr = '';
		try {
			qr = await promise;
		} catch (error) {
			console.log(error);
		}
		return { secret: secret, qr: qr };
	}

	@Post('disable')
	@UseGuards(AuthGuard)
	async disable(@Req() request: Request) {
		if (request.session.auth_level != AuthLevel.TWOFA)
			throw new HttpException('no totp has been set up', HttpStatus.FORBIDDEN);

		const user = await this.user_service.get_user({ user_id: request.session.user_id });
		user.secret = undefined;
		user.auth_req = AuthLevel.OAuth;

		const access_token = request.session.access_token;
		const user_id = request.session.user_id;

		await this.user_service.save([user]);
		if (!await this.session_utils.regenerate_session(request.session))
			throw new HttpException('unable to create request.session', HttpStatus.INTERNAL_SERVER_ERROR);
		request.session.auth_level = AuthLevel.OAuth;
		request.session.access_token = access_token;
		request.session.user_id = user_id;
	}

	async authenticate(otp: string, secret: string, request: Request): Promise<void> {
		if (!authenticator.check(otp, secret))
			throw new HttpException('invalid otp', HttpStatus.CONFLICT);

		const access_token = request.session.access_token;
		const user_id = request.session.user_id;

		if (!await this.session_utils.regenerate_session(request.session))
			throw new HttpException('unable to create request.session', HttpStatus.INTERNAL_SERVER_ERROR);

		request.session.access_token = access_token;
		request.session.user_id = user_id;
		request.session.auth_level = AuthLevel.TWOFA;
		await this.session_utils.save_session(request.session);
	}

	@Post('setup_verify')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(OAuthGuard)
	async setup_verify(@Body() otp_dto: OtpDto, @Req() request: Request) {
		console.log(request.session);
		if (!request.session.secret)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		const secret = request.session.secret;

		await this.authenticate(otp_dto.otp, secret, request);

		let user = await this.user_service.get_user({ user_id: request.session.user_id });
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

		const user = await this.user_service.get_user({ user_id: request.session.user_id });
		if (user.auth_req !== AuthLevel.TWOFA)
			throw new HttpException('2fa not setup', HttpStatus.FORBIDDEN);
		const secret = user.secret;

		await this.authenticate(otp_dto.otp, secret, request);
	}
}
