import {
	Controller,
	Get,
	Req,
	Res,
	Post,
	Query,
	HttpException,
	HttpStatus,
	Inject,
	Session,
	BadGatewayException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthorizationCode, AccessToken } from "simple-oauth2";
import * as rm from "typed-rest-client/RestClient";
import { BearerCredentialHandler } from "typed-rest-client/handlers/bearertoken";
import { SessionService, SessionObject } from "../services/session.service";
import { User } from "../entities/User";
import { AuthLevel } from "src/enums";
import { IsAlphanumeric } from "class-validator";
import { BACKEND_ADDRESS, FRONTEND_ADDRESS } from "../vars";
import { Repository } from "typeorm";
import { authenticate } from "src/auth/authenticate";

interface ResultDTO {
	id: number;
	login: string;
}

class TokenDTO {
	@IsAlphanumeric()
	code: string;
}

@Controller("oauth")
export class AuthController {
	private readonly client = new AuthorizationCode({
		client: {
			id: process.env.CLIENT_ID!,
			secret: process.env.CLIENT_SECRET!,
		},
		auth: {
			tokenHost: "https://api.intra.42.fr",
			authorizeHost: "https://api.intra.42.fr",
		},
	});

	constructor(
		private readonly session_utils: SessionService,
		@Inject("USER_REPO")
		private readonly userRepo: Repository<User>,
	) {}

	@Get("login")
	async login(@Req() request: Request, @Res() response: Response) {
		const user = await authenticate(request, this.userRepo);
		if (user) {
			response.redirect(`${FRONTEND_ADDRESS}/profile`);
		} else {
			const auth_uri = this.client.authorizeURL({
				redirect_uri: `${BACKEND_ADDRESS}/oauth/callback`,
				scope: "public",
			});
			response.redirect(auth_uri);
		}
	}

	@Post("logout")
	async logout(@Session() session: SessionObject) {
		session.auth_level = AuthLevel.None;
	
		await this.session_utils.destroy_session(session);

		return {};
	}

	async get_access_token(code: string): Promise<AccessToken | undefined> {
		try {
			const access_token = await this.client.getToken({
				code,
				redirect_uri: BACKEND_ADDRESS + "/oauth/callback",
				scope: "public",
			});
			return access_token;
		} catch (error) {
			console.error(error);
			throw new BadGatewayException();
		}
	}

	async get_id(access_token: AccessToken): Promise<number | undefined> {
		const rest_client = new rm.RestClient("pgp", "https://api.intra.42.fr", [
			new BearerCredentialHandler(access_token.token.access_token as string, false),
		]);
		const res = await rest_client.get<ResultDTO>("/v2/me");
		if (res.statusCode != 200) {
			console.error("received " + res.statusCode + " from intra when retrieving user id");
			return undefined;
		}

		const result = res.result;
		if (!result || !result.id || !result.login) {
			console.error("did not properly receive id and/or login from intra");
			return undefined;
		}
		return result.id;
	}

	@Get("callback")
	async get_token(
		@Query() token: TokenDTO,
		@Req() request: Request,
		@Res() response: Response,
	) {
		const access_token = await this.get_access_token(token.code);

		const oauth_id = await this.get_id(access_token);
		if (oauth_id == undefined)
			throw new HttpException("Could not verify identity", HttpStatus.UNAUTHORIZED);

		let user = await this.userRepo.findOneBy({ oauth_id });
		if (!user)
			user = await this.userRepo.save({ oauth_id } as User);

		await this.session_utils.regenerate_session_req(request);

		request.session.access_token = access_token.token.access_token.toString();
		request.session.user_id = user.id;
		request.session.auth_level = AuthLevel.OAuth;

		await this.session_utils.save_session(request.session);
		if (request.session.auth_level !== user.auth_req)
			response.redirect(FRONTEND_ADDRESS + "/otp_verify");
		else
			response.redirect(FRONTEND_ADDRESS + "/profile");
	}
}
