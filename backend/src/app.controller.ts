import { Get, Controller, UseGuards, Session, Req } from '@nestjs/common';
import { Request } from 'express';
import * as session from 'express-session';
import { AuthGuard } from './auth/auth.guard';
import { UserService } from './UserService';
import { AccessToken } from 'simple-oauth2';
import * as rm from 'typed-rest-client/RestClient';
import { BearerCredentialHandler } from 'typed-rest-client/handlers/bearertoken';
import { SessionUtils, SessionObject } from './SessionUtils';

interface IntraDto {
	id: number;
	login: string;
	image: {
		image_url: string;
		versions: {
			large: string;
			medium: string;
			small: string;
			micro: string;
		}
	}
}

async function get_me(token: string): Promise<IntraDto | undefined> {
	let rest_client = new rm.RestClient('pgp', 'https://api.intra.42.fr',
						[ new BearerCredentialHandler(token, false) ]);
	const res = await rest_client.get<IntraDto>('v2/me');
	if (res.statusCode != 200) {
		console.error('received ' + res.statusCode + ' from intra api');
		return undefined;
	}
	//console.log(res.result);
	return res.result;
}

@Controller()
export class AppController {
	constructor(private readonly user_service: UserService) {}

	@Get('whoami')
	@UseGuards(AuthGuard)
	async whoami(@Req() request: Request) {
		const user = await this.user_service.get_user(request.session.user_id);
		const me = await get_me(request.session.access_token);
		return { id: user.user_id, image: me.image.versions.medium };
	}	
}
