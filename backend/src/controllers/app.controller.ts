import {
	Get,
	Controller,
	UseGuards,
} from "@nestjs/common";
import { genName, genTeamName } from "../namegen";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";

@Controller()
@UseGuards(HttpAuthGuard, SetupGuard)
export class AppController {
	@Get("/room-name")
	roomName() {
		return genName();
	}
	
	@Get("/team-name")
	teamName() {
		return genTeamName();
	}
}
