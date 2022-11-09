import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthorizationCode } from 'simple-oauth2';
import * as session from 'express-session';

declare module 'express-session' {
	export interface SessionData {
		access_token: object;
	}
}

@Injectable()
export class OAuth2Guard implements CanActivate {
	private client = new AuthorizationCode({
		client: {
			id: process.env.CLIENT_ID,
			secret: process.env.CLIENT_SECRET,
		},
		auth: {
			tokenHost: 'https://api.intra.42.fr',
			authorizeHost: 'https://api.intra.42.fr',
		}
	});

	async authenticate(res: Response) {
		const auth_uri = this.client.authorizeURL({
			redirect_uri: 'http://localhost:3000/oauth/callback',
			scope: 'public'
		});

		res.redirect(auth_uri);
	}

	async get_token(request: Request, response: Response) {
		if (!(typeof request.query.code === 'string')) {
			response.status(400).json('Bad request');
			return false;
		}
		const code = request.query.code;

		try {
			const access_token = await this.client.getToken({
				code: code,
				redirect_uri: 'http://localhost:3000/oauth/callback',
				scope: 'public'
			});

			request.session.regenerate((err) => {
				if (err) {
					response.status(503).json('Failed to create a session');
					return false;
				}
			});
			//console.log(typeof access_token);
			request.session.access_token = access_token;
		} catch (error) {
			console.error(error.message);
			response.status(400).json('Authentication failed');
		}
		return true;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const [req, res, next] = context.getArgs();
		if (req.query.code) {
			return this.get_token(req, res);
		} else {
			this.authenticate(res);
		}
		return false;
	}
}
