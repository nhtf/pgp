import { ForbiddenException, Controller, Inject, Put, Delete, UseGuards, Body, HttpCode, HttpStatus, ClassSerializerInterceptor, UseInterceptors } from "@nestjs/common";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { HumanGuard } from "src/guards/bot.guard";
import { Me } from "src/util";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Gamemode, Subject, Action } from "src/enums";
import { Repository, DataSource } from "typeorm";
import { IsArray, ArrayNotEmpty, ArrayUnique, IsEnum, ValidationOptions, ValidationArguments, registerDecorator, IsNumber, ValidateNested } from "class-validator";
import type { User } from "src/entities/User";
import { PLAYER_NUMBERS, GameRoomService } from "src/services/gameroom.service";
import { Type } from "class-transformer";
import { UserService } from "src/services/user.service";
import { GameQueue } from "src/entities/GameQueue";

export function IsGamemodePlayerCount(gamemode_property: string, validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isGamemodePlayerCount',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [gamemode_property],
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					const [relatedPropertyName] = args.constraints;
					const relatedValue = (args.object as any)[relatedPropertyName];
					return typeof value ===  "number" && typeof relatedValue === "number" &&
						PLAYER_NUMBERS.has(relatedValue) && PLAYER_NUMBERS.get(relatedValue).includes(value);
				},
			},
		});
	};
}

class GamemodeDTO {
	@IsEnum(Gamemode)
	type: Gamemode;

	@IsArray()
	@ArrayNotEmpty()
	@IsNumber({}, { each: true })
	@IsGamemodePlayerCount("type", {
		each: true,
		message: "Invalid player count for gamemode type",
	})
	@ArrayUnique()
	player_counts: number[];
}

class GamemodesDTO {
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@ArrayUnique(o => {
		if (typeof o === "string")
			return Gamemode[o];
		return o;
	})
	@Type(() => GamemodeDTO)
	gamemodes: GamemodeDTO[];
}

type UserID = number;

interface QueueGamemode {
	gamemode: Gamemode;
	player_count: number;
};

function zip<T, U>(a: Array<T>, b: Array<U>): Array<[T, U]> {
	if (a.length !== b.length)
		throw new Error("Cannot zip arrays of different sizes");
	return a.map((elem, idx) => [elem, b[idx]]);
}

@Controller("match")
@UseGuards(HttpAuthGuard, SetupGuard, HumanGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class MatchController {

	constructor(
		private readonly user_service: UserService,
		private readonly game_service: GameRoomService,
		private readonly update_service: UpdateGateway,
		@Inject("GAMEQUEUE_REPO")
		private readonly queue_repo: Repository<GameQueue>,
		@Inject("DATA_SOURCE")
		private readonly data_source: DataSource,
	) {}

	async dequeue_users(...users: User[]) {
		const ids = users.map((user) => user.id);
		const query = this.data_source
			.createQueryBuilder()
			.delete()
			.from("queue")
			.where(`"userId" IN (:...ids)`, { ids: ids });
		await query.execute();
		for (const user of users)
			await this.user_service.dequeue(user);
	}

	async make_new_match(gamemode: Gamemode, player_count: number, users: User[]) {
		await this.dequeue_users(...users);
		const room = await this.game_service.create({
			is_private: false,
			gamemode,
			players: player_count,
			ranked: true,
		});

		await this.game_service.lock_teams(room);

		const members = await this.game_service.add_members(room, ...users.map((user) => {
			return { user };
		}));

		const teams =  await this.game_service.get_teams(room);

		for (const [member, team] of zip(members, teams)) {
			await this.game_service.set_team(member, team);
		}

		this.update_service.send_update({
			subject: Subject.REDIRECT,
			action: Action.INSERT,
			id: room.id,
			value: {
				message: "Found a game",
				url: `/game/${room.id}`,
				can_cancel: true,
			}
		}, ...users);
	}

	async find_or_new(gamemode: Gamemode, player_count: number) {
		let queue = await this.queue_repo.findOneBy({ gamemode, player_count });
		if (queue == undefined) {
			queue = new GameQueue();
			queue.gamemode = gamemode;
			queue.player_count = player_count;
			queue.users = [];
		}
		return queue;
	}

	@Put("me")
	@HttpCode(HttpStatus.NO_CONTENT)
	async enqueue(
		@Me() user: User,
		@Body() dto: GamemodesDTO,
	) {
		if (await this.game_service.is_in_ranked(user)) {
			throw new ForbiddenException("Already in a ranked game");
		}
		const to_save = [];
		for (const gamemode of dto.gamemodes) {
			for (const player_count of gamemode.player_counts) {
				const queue = await this.find_or_new(gamemode.type, player_count);
				if (queue.users.findIndex(({ id }) => id === user.id) >= 0)
					continue;

				queue.users.push(user);
				to_save.push(queue);

				if (queue.users.length >= queue.player_count) {
					await this.make_new_match(queue.gamemode, queue.player_count, queue.users);
					return;
				}
			}
		}
		if (!user.queueing) {
			await this.user_service.enqueue(user);
		}
		await this.queue_repo.save(to_save);
	}

	@Delete("me")
	@HttpCode(HttpStatus.NO_CONTENT)
	async dequeue(
		@Me() user: User,
	) {
		await this.dequeue_users(user);
		await this.user_service.dequeue(user);
	}
}
