import { Controller, Post, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import isNumeric from 'validator/lib/isNumeric';
import isLength from 'validator/lib/isLength';
import * as session from 'express-session';

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
		const otpauth = authenticator.keyuri('username', 'pgp', secret);
		const promise = new Promise((resolve, reject) => {
			qrcode.toDataURL(otpauth, (error, image_url) => {
				if (error) {
					console.log(error);
					reject(error);
				} else {
					resolve(image_url);
				}
			});
		});

		try {
			const qr = await promise;
			response.status(202).json({secret: secret, qrcode: qr });
		} catch (_) {
			response.status(202).json({secret: secret});
		}
		console.log('before: ' + request.session.secret);
		request.session.secret = secret;
		request.session.save((error) => {
			if (error) {
				console.error(error);
				return response.status(503).header('Retry-After', 'a day').send();
			}
		});
		console.log('after: ' + request.session.secret);
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
		//TODO check if the old session is removed from the database when regenerate happens
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
