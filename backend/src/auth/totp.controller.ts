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
	InternalServerErrorException
} from "@nestjs/common";
import { Request } from "express";
import { authenticator } from "otplib";
import { SessionService } from "src/services/session.service";
import { AuthLevel } from "src/enums";
import { Length, IsNumberString } from "class-validator";
import { HttpAuthGuard } from "./auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { HumanGuard } from "src/guards/bot.guard";
import * as qrcode from "qrcode";
import { Me } from "../util";
import { User } from "../entities/User";
import { Repository } from "typeorm";
import { UpdateGateway } from "src/gateways/update.gateway"
import { Subject, Action } from "src/enums"

@Injectable()
class OAuthGuard implements CanActivate {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		//TODO check for null and undefined instead of !request.session?.access_token ?
		if (!request.session?.access_token || !(request.session?.auth_level >= AuthLevel.OAuth)) {
			response.status(401).json("Unauthorized");
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

@Controller("otp")
@UseGuards(OAuthGuard, HumanGuard)
export class TotpController {
	constructor(
		private readonly session_utils: SessionService,
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>
	) {}

	@Post("setup")
	@HttpCode(HttpStatus.ACCEPTED)
    @UseGuards(HttpAuthGuard, SetupGuard)
	async setup(@Me() user: User, @Req() request: Request) {
		if (user.auth_req === AuthLevel.TWOFA) {
			throw new HttpException("already setup 2fa", HttpStatus.FORBIDDEN);
		}

		let session = request.session;
	
		//https://www.rfc-editor.org/rfc/rfc4226 section 4
		const secret = authenticator.generateSecret(20);

		session.secret = secret;
		if (!this.session_utils.save_session(session))
			throw new InternalServerErrorException();

		const otpauth = authenticator.keyuri(user.username, "pgp", secret);
		const promise = new Promise((resolve: (value: string) => void, reject) => {
			qrcode.toDataURL(otpauth, (error, image_url) => {
				error ? reject(error) : resolve(image_url);
			});
		});

		try {
			const qr = await promise;
			return { secret, qr };
		} catch (error) {
			console.log("qr", error);
			throw new InternalServerErrorException();
		}
	}

	@Post("disable")
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(HttpAuthGuard, SetupGuard)
	async disable(@Me() user: User, @Req() request: Request) {
		if (request.session.auth_level != AuthLevel.TWOFA)
			throw new HttpException("No totp has been set up", HttpStatus.FORBIDDEN);

		user.secret = null;
		user.auth_req = AuthLevel.OAuth;

		const access_token = request.session.access_token;
		const id = request.session.user_id;

		await this.userRepo.save(user);

		UpdateGateway.instance.send_update({
			subject: Subject.USER,
			action: Action.UPDATE,
			id: user.id,
			value: { auth_req: user.auth_req },
		}, user);
	
		if (!(await this.session_utils.regenerate_session_req(request)))
			throw new HttpException(
				"unable to create session",
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
			throw new HttpException("Invalid otp", HttpStatus.CONFLICT);

		const access_token = request.session.access_token;
		const id = request.session.user_id;

		await this.session_utils.regenerate_session_req(request);

		request.session.access_token = access_token;
		request.session.user_id = id;
		request.session.auth_level = AuthLevel.TWOFA;
		await this.session_utils.save_session(request.session);
	}

	@Post("setup_verify")
	@HttpCode(HttpStatus.CREATED)
	@UseGuards(HttpAuthGuard, SetupGuard)
	async setup_verify(@Me() user: User, @Body() otp_dto: OtpDTO, @Req() request: Request) {
		if (!request.session.secret) {
			throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
		}

		const secret = request.session.secret;

		await this.authenticate(otp_dto.otp, secret, request);

		user.auth_req = AuthLevel.TWOFA;
		user.secret = secret;

		await this.userRepo.save(user);

		UpdateGateway.instance.send_update({
			subject: Subject.USER,
			action: Action.UPDATE,
			id: user.id,
			value: { auth_req: user.auth_req },
		}, user);
	}

	@Post("verify")
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(SetupGuard)
	async verify(@Me() user: User, @Body() otp_dto: OtpDTO, @Req() request: Request) {
		if (request.session.secret) {
			throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
		}

		if (user.auth_req !== AuthLevel.TWOFA) {
			throw new HttpException("2fa not setup", HttpStatus.FORBIDDEN);
		}
		
		const secret = user.secret;

		await this.authenticate(otp_dto.otp, secret, request);
	}
}
