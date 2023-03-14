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

interface result_dto {
	id: number;
	login: string;
}

class token_dto {
	@IsAlphanumeric()
	code: string;
}

@Controller("oauth")
export class AuthController {
	private readonly client = new AuthorizationCode({
		client: {
			id: process.env.CLIENT_ID,
			secret: process.env.CLIENT_SECRET,
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
		const auth_uri = this.client.authorizeURL({
			redirect_uri: `${BACKEND_ADDRESS}/oauth/callback`,
			scope: "public",
		});
		response.redirect(auth_uri);
		return response.send();
	}

	@Post("logout")
	async logout(@Session() session: SessionObject) {
		session.auth_level = AuthLevel.None;
	
		if (!await this.session_utils.destroy_session(session)) {
			throw new HttpException(
				"could not logout",
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}

		return {};
	}

	async get_access_token(code: string): Promise<AccessToken | undefined> {
		try {
			const access_token = await this.client.getToken({
				code: code,
				redirect_uri: BACKEND_ADDRESS + "/oauth/callback",
				scope: "public",
			});
			return access_token;
		} catch (error) {
			throw new HttpException(
				error.output.payload.error,
				error.output.statusCode,
			);
		}
	}

	//TODO added a as string to make it stop complaining, needs proper fix - Siebe
	async get_id(access_token: AccessToken): Promise<number | undefined> {
		let rest_client = new rm.RestClient("pgp", "https://api.intra.42.fr", [
			new BearerCredentialHandler(access_token.token.access_token as string, false),
		]);
		const res = await rest_client.get<result_dto>("/v2/me");
		if (res.statusCode != 200) {
			console.error(
				"received " + res.statusCode + " from intra when retrieving user id",
			);
			return undefined;
		}

		const result = res.result;
		if (!result.id || !result.login) {
			console.error("did not properly receive id and/or login from intra");
			return undefined;
		}
		return result.id;
	}

	@Get("callback")
	async get_token(
		@Query() token: token_dto,
		@Req() request: Request,
		@Res() response: Response,
	) {
		const access_token = await this.get_access_token(token.code);

		if (!(await this.session_utils.regenerate_session_req(request))) //TODO regenerate session after the identity is validated of the user
			throw new HttpException(
				"failed to create session",
				HttpStatus.SERVICE_UNAVAILABLE,
			);

		const oauth_id = await this.get_id(access_token);
		if (!oauth_id)
			throw new HttpException("could not verify identity", HttpStatus.INTERNAL_SERVER_ERROR); //TODO this is probably a unauthorized exeption instead of an internal error, since the user could've just send bs

		let user = await this.userRepo.findOneBy({ oauth_id: oauth_id });
		if (!user) {
			user = new User();
			user.oauth_id = oauth_id;
			await this.userRepo.save(user);
		}

		//TODO added a as string to make it stop complaining, needs proper fix - Siebe
		request.session.access_token = access_token.token.access_token.toString();
		request.session.user_id = user.id;
		request.session.auth_level = AuthLevel.OAuth;

		await this.session_utils.save_session(request.session);
		if (request.session.auth_level != user.auth_req)
			response.redirect(FRONTEND_ADDRESS + "/otp_verify");
		else
			response.redirect(FRONTEND_ADDRESS + "/profile");
	}
}
