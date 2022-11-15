import { Controller, Post, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { authenticator } from 'otplib';
import isNumeric from 'validator/lib/isNumeric';
import isLength from 'validator/lib/isLength';
import * as session from 'express-session';
import { data_source } from '../main'

@Controller('otp')
export class TotpController {
	@Post('setup')
	async setup(@Req() request: Request, @Res() response: Response) {
		if (!request.session.access_token && process.env.PGP_DEBUG == undefined)
			return response.status(401).json('unauthorized').send;
		if (request.session.secret)
			return response.status(429).json('already requested otp setup').send();
		//TODO check if user already has 2fa setup
		
		//https://www.rfc-editor.org/rfc/rfc4226 section 4
		const secret = authenticator.generateSecret(20);

		response.status(202).json({ secret: secret});

		request.session.secret = secret;
		request.session.save((error) => {
			if (error) {
				console.error(error);
				return response.status(503).header('Retry-After', 'a day').json('unable to save session').send();
			}
		});
		return response.send();
	}

	@Post('setup_verify')
	async setup_verify(@Req() request: Request, @Res() response: Response) {
		if (!request.session.access_token && process.env.PGP_DEBUG == undefined)
			return response.status(401).json('unauthorized').send();
		if (!request.session.secret)
			return response.status(403).json('forbidden').send();
		//TODO check if body-parser is being used
		const code = request.body.otp;
		if (typeof code !== 'string')
			return response.status(400).json('otp not a string').send();
		if (!isNumeric(code) || !isLength(code, {min: 6, max: 6}))
			return response.status(400).json('malformed otp').send();
		if (!authenticator.check(code, request.session.secret))
			return response.status(409).json('invalid otp').send();
		//TODO commit secret to user database
		const access_token = request.session.access_token;
		//TODO check if the old session is removed from the session database when regenerate happens
		request.session.regenerate((error) => {
			if (error) {
				console.error(error);
				return response.status(500).json('unable to create session').send();
			}
		});
		request.session.access_token = access_token;
		return response.status(201).json('setup totp').send();
	}
}
