import { Get, Controller } from '@nestjs/common';

@Controller()
export class AppController {

	@Get('index')
	async getHello() {
		return 'well hello there';
	}	
}
