import {
	Controller,
	Post,
	Req,
	UseGuards,
	Injectable,
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
	Body,
	Inject,
	HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { authenticator } from 'otplib';
import { SessionService } from 'src/services/session.service';
import { AuthLevel } from '../enums/AuthLevel';
import { Length, IsNumberString } from 'class-validator';
import { AuthGuard } from './auth.guard';
import { SetupGuard } from 'src/guards/setup.guard';
import * as qrcode from 'qrcode';
import { Me } from '../util';
import { User } from '../entities/User';
import { Repository } from 'typeorm';

@Injectable()
class OAuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		let response = context.switchToHttp().getResponse();
		if (
			request.session.access_token === undefined ||
			request.session.auth_level !== AuthLevel.OAuth
		) {
			response.status(401).json('unauthorized');
			return false;
		}
		return true;
	}
}

class OtpDTO {
	@Length(6, 6)
	@IsNumberString()
	otp: string;
}

@Controller('otp')
export class TotpController {
	constructor(
		private readonly session_utils: SessionService,
		@Inject('USER_REPO')
		private readonly userRepo: Repository<User>
	) {}

	@Post('setup')
	@HttpCode(HttpStatus.ACCEPTED)
    @UseGuards(AuthGuard, SetupGuard)
	async setup(@Me() user: User, @Req() request: Request) {
		let session = request.session;
		if (user.auth_req === AuthLevel.TWOFA)
			throw new HttpException('already setup 2fa', HttpStatus.FORBIDDEN);

		//https://www.rfc-editor.org/rfc/rfc4226 section 4
		const secret = authenticator.generateSecret(20);

		session.secret = secret;
		if (!this.session_utils.save_session(session))
			throw new HttpException(
				'unable to save session',
				HttpStatus.SERVICE_UNAVAILABLE,
			);

		const otpauth = authenticator.keyuri(user.username, 'pgp', secret);
		const promise = new Promise((resolve: (value: string) => void, reject) => {
			qrcode.toDataURL(otpauth, (error, image_url) => {
				if (error) reject(error);
				else resolve(image_url);
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
	@UseGuards(AuthGuard, SetupGuard)
	async disable(@Me() user: User, @Req() request: Request) {
		if (request.session.auth_level != AuthLevel.TWOFA)
			throw new HttpException('no totp has been set up', HttpStatus.FORBIDDEN);

		user.secret = undefined;
		user.auth_req = AuthLevel.OAuth;

		const access_token = request.session.access_token;
		const id = request.session.user_id;

		await this.userRepo.save(user);
		if (!(await this.session_utils.regenerate_session(request.session)))
			throw new HttpException(
				'unable to create session',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		request.session.auth_level = AuthLevel.OAuth;
		request.session.access_token = access_token;
		request.session.user_id = id;
	}

	async authenticate(
		otp: string,
		secret: string,
		request: Request,
	): Promise<void> {
		if (!authenticator.check(otp, secret))
			throw new HttpException('invalid otp', HttpStatus.CONFLICT);

		const access_token = request.session.access_token;
		const id = request.session.user_id;

		if (!(await this.session_utils.regenerate_session(request.session)))
			throw new HttpException(
				'unable to create request.session',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);

		request.session.access_token = access_token;
		request.session.user_id = id;
		request.session.auth_level = AuthLevel.TWOFA;
		await this.session_utils.save_session(request.session);
	}

	@Post('setup_verify')
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(AuthGuard, SetupGuard)
	async setup_verify(@Me() user: User, @Body() otp_dto: OtpDTO, @Req() request: Request) {
		if (!request.session.secret)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		const secret = request.session.secret;

		await this.authenticate(otp_dto.otp, secret, request);

		user.auth_req = AuthLevel.TWOFA;
		user.secret = secret;
		await this.userRepo.save(user);
	}

	@Post('verify')
	@HttpCode(HttpStatus.OK)
	@UseGuards(OAuthGuard, SetupGuard)
	async verify(@Me() user: User, @Body() otp_dto: OtpDTO, @Req() request: Request) {
		if (request.session.secret)
			throw new HttpException('forbidden', HttpStatus.FORBIDDEN);

		if (user.auth_req !== AuthLevel.TWOFA)
			throw new HttpException('2fa not setup', HttpStatus.FORBIDDEN);
		const secret = user.secret;

		await this.authenticate(otp_dto.otp, secret, request);
	}
}
