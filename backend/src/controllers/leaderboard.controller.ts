import { Param, Query, NotFoundException, BadRequestException, Inject, Controller, Get, UseGuards } from "@nestjs/common";
import { Repository } from "typeorm";
import { SetupGuard } from "src/guards/setup.guard";
import { HttpAuthGuard } from "src/auth/auth.guard";
import type { LeaderboardView } from "src/entities/LeaderboardView";
import { Gamemode } from "src/enums";
import { registerDecorator, ValidationOptions, ValidationArguments, IsIn, IsString, IsNumberString, IsOptional } from "class-validator";
import { PLAYER_NUMBERS } from "src/services/gameroom.service";
import { UserService } from "src/services/user.service";
import validator from "validator";
import { ParseUsernamePipe } from "src/util";
import type { User } from "src/entities/User";

export function IsIntegerString(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: "IsIntegerString",
			target: object.constructor,
			propertyName,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (typeof value !== "string")
						return false;
					if (!validator.isNumeric(value))
						return false;
					const number = Number(value);
					if (number > 2 ** 31 - 1)
						return false;
					return true;
				}
			},
		})
	}
}

class OptionsDTO {
	@IsNumberString()
	@IsIn(Object.values(Gamemode)
	      .filter((val) => typeof val === "number")
	      .map((val) => val.toString()))
	@IsOptional()
	gamemode: string;

	@IsNumberString({
		no_symbols: true
	})
	@IsIn([...new Set(Object.values(Gamemode)
	      .filter((gamemode) => typeof gamemode === "number")
	      .flatMap((gamemode) => PLAYER_NUMBERS.get(gamemode as number))
	      .map((val) => val.toString()))]
	)
	@IsOptional()
	team_count: string;

	@IsIntegerString({
		message: "page must be an integer string"
	})
	@IsOptional()
	page: string;

	@IsString()
	@IsOptional()
	username: string;

	@IsString()
	@IsIn(["ASC", "DESC"])
	@IsOptional()
	sort: string;
}

@Controller("leaderboard")//TODO rename to stats
@UseGuards(HttpAuthGuard, SetupGuard)
export class LeaderboardController { 

	constructor(
		@Inject("LEADERBOARDVIEW_REPO")
		private readonly leader_repo: Repository<LeaderboardView>,
		private readonly user_service: UserService,
	) {}

	@Get()
	async get(@Query() dto: OptionsDTO) {
		if (dto.username != undefined && (await this.user_service.get_by_username(dto.username) == undefined)) {
			throw new NotFoundException("User not found")
		}
		return this.leader_repo.find({
			where: {
				gamemode: (dto.gamemode != undefined) ? Number(dto.gamemode) : undefined,
				team_count: (dto.team_count != undefined) ? Number(dto.team_count) : undefined,
				username: dto.username,
			},
			order: {
				rank: dto.sort as any,
			},
			take: 10,
			skip: (dto.page != undefined) ? Number(dto.page) : undefined,
		});
	}

	@Get("levels/:username")
	async get_level(@Param("username", ParseUsernamePipe()) user: User) {
		const games = await this.leader_repo.find({
			where: { id: user.id },
		});
		let count = 0;
		for (const game of games) {
			count += game.wins + game.losses + game.draws;
		}
		return Math.log(count); //TODO add some fancy calculation
	}
}
