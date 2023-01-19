import {
	Get,
	Controller,
	Redirect,
	HttpStatus,
} from '@nestjs/common';
import { BACKEND_ADDRESS } from '../vars';

@Controller()
export class AppController {
	@Get('whoami')
	@Redirect(BACKEND_ADDRESS + '/account/whoami', HttpStatus.PERMANENT_REDIRECT)
	async whoami() {}
}
