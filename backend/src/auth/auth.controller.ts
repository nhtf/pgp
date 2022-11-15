import { Controller, Get, UseGuards, Req, Res, Put, Post } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthorizationCode, AccessToken } from 'simple-oauth2';
import * as session from 'express-session';
import * as rm from 'typed-rest-client/RestClient';
import { BearerCredentialHandler } from 'typed-rest-client/handlers/bearertoken';
import isAlphanumeric from 'validator/lib/isAlphanumeric';
import { User, AuthLevel } from '../User';
import { data_source } from '../main';

declare module 'express-session' {
	export interface SessionData {
		access_token: object;
		secret: string | undefined;
		user_id: number;
	}
}

interface result_dto {
	id: number;
	login: string;
}

/*
		try {
			const access_token = await this.client.getToken({
				code: code,
				redirect_uri: 'http://localhost:3000/oauth/callback',
				scope: 'public'
			});

			request.session.regenerate((err) => {
				console.log('done');
				if (err)
					return response.status(503).json('failed to create a session').send();
			});
			//TODO this gets executed before the session is actually regenerated, bad!!

			let rest_client = new rm.RestClient('pgp', 'https://api.intra.42.fr',
												[new BearerCredentialHandler(access_token.token.access_token, false)]);
			const res = await rest_client.get<result_dto>('/v2/me');
			if (res.statusCode != 200)
				return response.status(500).json('could not retrieve data from intra api').send();

			const result = res.result;
			if (!result.id || !result.login)
				return response.status(500).json('got a malformed response from intra api').send();

			const user = await data_source.getRepository(User).findOneById(result.id);
			console.log('');
			if (user == null) {
				console.log('creating new user entry');
				await data_source.getRepository(User).save({
					user_id: result.id,
					auth_req: AuthLevel.OAuth,
					secret: undefined
				});
			}
			console.log(user);

			request.session.user_id = result.id;
			request.session.access_token = access_token;
			response.redirect('http://localhost:5173/');
		} catch (_) {
			response.status(403).json('forbidden');
		}
	   */

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
	async login(@Res() response: Response) {
		const auth_uri = this.client.authorizeURL({
			redirect_uri: 'http://localhost:3000/oauth/callback',
			scope: 'public'
		});
		response.redirect(auth_uri);
		return response.send();
	}

	is_valid_code(code: any): code is string {
		if (typeof code !== 'string')
			return false;
		if (!isAlphanumeric(code))
			return false;
		return true;
	}

	has_query(request: Request) : boolean {
		if (!request.query || !request.query.code)
			return false;
		return true;
	}

	async get_access_token(code: string): Promise<AccessToken | undefined> {
		try {
			const access_token = await this.client.getToken({
				code: code,
				redirect_uri: 'http://localhost:3000/oauth/callback',
				scope: 'public'
			});
			return access_token;
		} catch (error) {
			return undefined;
		}
	}

	async regenerate_session(session: session.Session): Promise<boolean> {
		const promise = new Promise((resolve: (value: boolean) => void, reject: (value: boolean) => void) => {
			session.regenerate((error) => {
				if (error) {
					console.error(error);
					reject(false);
				} else {
					resolve(true);
				}
			});
		});
		return await promise;
	}

	//TODO add verbose logging to entire api
	async get_user_id(access_token: AccessToken): Promise<number | undefined> {
			let rest_client = new rm.RestClient('pgp', 'https://api.intra.42.fr',
												[new BearerCredentialHandler(access_token.token.access_token, false)]);
			const res = await rest_client.get<result_dto>('/v2/me');
			if (res.statusCode != 200)
				return undefined;

			const result = res.result;
			if (!result.id || !result.login)
				return undefined;
			return result.id;
	}

	async user_exists(user_id: number): Promise<boolean> {
		return await data_source.getRepository(User).findOneById(user_id) !== null;
	}

	async user_create(user_id: number): Promise<boolean> {
		try {
			await data_source.getRepository(User).save({
				user_id: user_id,
				auth_req: AuthLevel.OAuth,
				secret: undefined
			});
			return true;
		} catch (_) {
			return false;
		}
	}	

	@Get('callback')
	async get_token(@Req() request: Request, @Res() response: Response) {
		if (!this.has_query(request))
			return response.redirect('http://localhost:3000/oauth/login');

		const code = request.query.code;
		if (!this.is_valid_code(code))
			return response.status(400).json('malformed code');

		const access_token = await this.get_access_token(code);
		if (access_token == undefined)
			return response.status(502).json('bad gateway').send();

		if (!(await this.regenerate_session(request.session)))
			return response.status(503).json('failed to create a session').send();

		const user_id = await this.get_user_id(access_token);
		if (user_id == undefined)
			return response.status(502).json('bad gateway');

		if (!(await this.user_exists(user_id))) {
			if (!(await this.user_create(user_id)))
				return response.status(500).json('failed to create database entry');
		}

		request.session.access_token = access_token;
		request.session.user_id = user_id;
		response.redirect('http://localhost:5173/');
		return response.send();
	}
}
