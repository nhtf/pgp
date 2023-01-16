import {
	Get,
	Controller,
	UseGuards,
	Redirect,
	HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import * as rm from 'typed-rest-client/RestClient';
import { BearerCredentialHandler } from 'typed-rest-client/handlers/bearertoken';
import { BACKEND_ADDRESS } from '../vars';

interface IntraDTO {
	id: number;
	login: string;
	image: {
		image_url: string;
		versions: {
			large: string;
			medium: string;
			small: string;
			micro: string;
		};
	};
}

async function get_me(token: string): Promise<IntraDTO | undefined> {
	let rest_client = new rm.RestClient('pgp', 'https://api.intra.42.fr', [
		new BearerCredentialHandler(token, false),
	]);
	const res = await rest_client.get<IntraDTO>('v2/me');
	if (res.statusCode != 200) {
		console.error('received ' + res.statusCode + ' from intra api');
		return undefined;
	}
	//console.log(res.result);
	return res.result;
}

@Controller()
export class AppController {
	@Get('whoami')
	@Redirect(BACKEND_ADDRESS + '/account/whoami', HttpStatus.PERMANENT_REDIRECT)
	@UseGuards(AuthGuard)
	async whoami() {}
}
