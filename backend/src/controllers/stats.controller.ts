import { Query, NotFoundException, Inject, Controller, Get, UseGuards, UseInterceptors, ClassSerializerInterceptor } from "@nestjs/common";
import { Repository } from "typeorm";
import { SetupGuard } from "src/guards/setup.guard";
import { HttpAuthGuard } from "src/auth/auth.guard";
import type { LeaderboardView } from "src/entities/LeaderboardView";
import { Gamemode } from "src/enums";
import { registerDecorator, ValidationOptions, ValidationArguments, IsIn, IsString, IsBooleanString, IsNumberString, IsOptional } from "class-validator";
import { PLAYER_NUMBERS } from "src/services/gameroom.service";
import { UserService } from "src/services/user.service";
import validator from "validator";
import { ParseUsernamePipe } from "src/util";
import { User } from "src/entities/User";
import { GameRoomService } from "src/services/gameroom.service";

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
	sort: "ASC" | "DESC";

	@IsBooleanString()
	@IsOptional()
	ranked: string;
}

@Controller("stat(s)?")
@UseGuards(HttpAuthGuard, SetupGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class StatsController { 

	constructor(
		@Inject("LEADERBOARDVIEW_REPO")
		private readonly leader_repo: Repository<LeaderboardView>,
		private readonly user_service: UserService,
		private readonly game_service: GameRoomService,
	) {}

	@Get()
	async get(@Query() dto: OptionsDTO) {
		if (dto.username != undefined && (await this.user_service.get_by_username(dto.username) == undefined)) {
			throw new NotFoundException("User not found")
		}
		const query = this.leader_repo
			.createQueryBuilder("entry")
			.select(`"id"`)
			.addSelect("username")
			.addSelect("gamemode")
			.addSelect("team_count")

		query
			.addSelect("SUM(wins)::INTEGER", "wins")
			.addSelect("SUM(losses)::INTEGER", "losses")
			.addSelect("SUM(draws)::INTEGER", "draws")
			.addSelect("(SUM(wins) + SUM(draws) * 0.5) / GREATEST(SUM(wins) + SUM(losses) + SUM(draws), 10)", "rank");
		if (dto.gamemode != undefined)
			query.andWhere("gamemode = :gamemode", { gamemode: Number(dto.gamemode) });
		if (dto.team_count != undefined)
			query.andWhere("team_count = :team_count", { team_count: Number(dto.team_count) });
		if (dto.username != undefined)
			query.andWhere("username = :username", { username: dto.username });
		if (dto.ranked != undefined)
			query.andWhere("ranked = :ranked", { ranked: dto.ranked === "true" });

		query.take(10);
		if (dto.page != undefined)
			query.skip(Number(dto.page));
		query
			.groupBy("id")
			.addGroupBy("username")
			.addGroupBy("gamemode")
			.addGroupBy("team_count");
		if (dto.sort != undefined)
			query.orderBy("rank", dto.sort);
			query.addOrderBy("id", "ASC");
		return await query.getRawMany();
	}

	@Get("level(s)")
	async get_level(@Query("username", ParseUsernamePipe()) user: User) {
		const games = await this.leader_repo.find({
			where: { id: user.id },
		});
		let count = 0;
		for (const game of games) {
			count += game.wins + game.losses + game.draws;
		}
		return { level: Math.log(count + 1) + 1 }; //ODOT add some fancy calculation
	}

	@Get("history")
	async history(@Query("username", ParseUsernamePipe(User)) user: User) {
		return await this.game_service.get_states(user);
	}
}
