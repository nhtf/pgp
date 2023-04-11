import { Inject, Controller, Get, UseGuards } from "@nestjs/common";
import { Repository } from "typeorm";
import { SetupGuard } from "src/guards/setup.guard";
import { HttpAuthGuard } from "src/auth/auth.guard";
import type { GameState } from "src/entities/GameState";

@Controller("leaderboard")
@UseGuards(HttpAuthGuard, SetupGuard)
export class LeaderboardController { 

	constructor(
		@Inject("GAMESTATE_REPO")
		private readonly game_repo: Repository<GameState>
	) {}

	@Get()
	async get() {

	}
}
