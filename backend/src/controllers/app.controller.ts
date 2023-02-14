import {
	Get,
	Controller,
} from "@nestjs/common";

import {
	genName
} from "../namegen";

@Controller()
export class AppController {
	@Get("/room-name")
	roomName() {
		return genName();
	}
}
