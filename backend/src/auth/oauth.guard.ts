import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthorizationCode } from 'simple-oauth2';

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
		console.log(code);

		try {
			const access_token = await this.client.getToken({ code: code, redirect_uri: 'http://localhost:3000/oauth/callback', scope: 'public'});

			console.log('access token: ' + access_token.token);
			response.status(200).json(access_token.token);
		} catch (error) {
			console.error(error.message);
			//return response.status(400).json('Authentication failed');
		}
		return false;
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
