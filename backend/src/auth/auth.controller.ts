import { Controller, Get, UseGuards, Req, Res, Put, Post } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthorizationCode } from 'simple-oauth2';
import * as session from 'express-session';
import isAlphanumeric from 'validator/lib/isAlphanumeric';

declare module 'express-session' {
	export interface SessionData {
		access_token: object;
		secret: string | undefined;
	}
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


	@Get('amiloggedin')
	async amiloggedin(@Req() request: Request, @Res() response: Response) {
		console.log(request.session);
		if (request.session.access_token)
			return response.status(200).json('yes');
		else
			return response.status(401).json('no');
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

	@Get('callback')
	async get_token(@Req() request: Request, @Res() response: Response) {
		if (!request.query || !request.query.code)
			return response.redirect('http://localhost:3000/oauth/login');

		const code = request.query.code;
		if (!(typeof code === 'string'))
			return response.status(400).json('bad request').send();

		if (!isAlphanumeric(code))
			return response.status(400).json('malformed code').send();

		try {
			const access_token = await this.client.getToken({
				code: code,
				redirect_uri: 'http://localhost:3000/oauth/callback',
				scope: 'public'
			});

			request.session.regenerate((err) => {
				if (err)
					return response.status(503).json('failed to create a session').send();
			});

			request.session.access_token = access_token;
			response.redirect('http://localhost:5173/');
		} catch (_) {
			response.status(403).json('forbidden');
		}
		return response.send();
	}
}
