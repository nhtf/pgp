import { Controller, Inject, Put, Delete, UseGuards, ParseEnumPipe, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { IRoomService } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { HttpAuthGuard } from "src/auth/auth.guard";
import { SetupGuard } from "src/guards/setup.guard";
import { HumanGuard } from "src/guards/bot.guard";
import { Me } from "src/util";
import { UpdateGateway, RedirectPacket, create_packet } from "src/gateways/update.gateway";
import { Gamemode, Subject, Action } from "src/enums";
import { Repository } from "typeorm";
import { FRONTEND_ADDRESS } from "src/vars";
import { IsArray, ArrayNotEmpty, ArrayContains, ArrayUnique, IsEnum, ValidationOptions, ValidationArguments, registerDecorator, IsNumber, ValidateNested } from "class-validator";
import type { User } from "src/entities/User";
import { PLAYER_NUMBERS, GameRoomService } from "src/services/gameroom.service";
import { Type } from "class-transformer";
import { UserService } from "src/services/user.service";
import type { Team } from "src/entities/Team"

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

@Controller("match")
@UseGuards(HttpAuthGuard, SetupGuard, HumanGuard)
export class MatchController {

	//private readonly queue: Map<QueueGamemode, Array<UserID>> = new Map();
	private readonly queue: Map<Gamemode, Map<number, Array<UserID>>> = new Map();

	constructor(
		private readonly user_service: UserService,
		private readonly game_service: GameRoomService,
		private readonly update_service: UpdateGateway,
	) {}

	dequeue_user(id: number) {
		for (const [_, modes] of this.queue.entries()) {
			for (const [_, users] of modes.entries()) {
				const idx = users.indexOf(id);
				if (idx < 0)
					continue;
				users.splice(idx, 1);
			}
		}
	}

	async make_match(type: QueueGamemode) {
		const room = await this.game_service.create({ is_private: true, gamemode: type.gamemode, players: type.player_count });

		await this.game_service.lock_teams(room);
	
		const ids = this.queue.get(type.gamemode).get(type.player_count);
		const members = await this.game_service.add_members(room, ...ids.map((id) => {
			return { user: { id } as User };
		}));

		const teams =  await this.game_service.get_teams(room);

		for (const [member, team] of members.map<[GameRoomMember, Team]>((member, idx) => [member, teams[idx]])) {
			await this.game_service.set_team(member, team);
			this.dequeue_user(member.user.id);
		}
		this.update_service.send_update({
			subject: Subject.REDIRECT,
			action: Action.INSERT,
			id: room.id,
			value: {
				url: `${FRONTEND_ADDRESS}/game/${room.id}`,
				can_cancel: true,
			}
		}, ...[]);
	}

	@Put("me")
	@HttpCode(HttpStatus.NO_CONTENT)
	async enqueue(
		@Me() user: User,
		@Body() dto: GamemodesDTO,
	) {
		const list = [];
		console.log(this.queue);
		for (const gamemode of dto.gamemodes) {
			const gamemode_map = this.queue.get(gamemode.type) ?? this.queue.set(gamemode.type, new Map()).get(gamemode.type);
			for (const player_count of gamemode.player_counts) {
				const type: QueueGamemode = { gamemode: gamemode.type, player_count };
				const waiting = gamemode_map.get(player_count);
				if (waiting == undefined) {
					list.push(type)
					continue;
				}
				if (waiting.includes(user.id))
					continue;

				if (waiting.length + 1 == player_count) {
					waiting.push(user.id);
					await this.make_match(type);
					return;
				}
			}
		}
		for (const item of list) {
			if (!this.queue.has(item.gamemode))
				this.queue.set(item.gamemode, new Map());
			const gamemode_map = this.queue.get(item.gamemode);

			if (gamemode_map.has(item.player_count))
				gamemode_map.get(item.player_count).push(user.id);
			else
				gamemode_map.set(item.player_count, [user.id]);
		}
	}

	@Delete("me")
	@HttpCode(HttpStatus.NO_CONTENT)
	async dequeue(
		@Me() user: User,
		@Body() dto: GamemodesDTO
	) {
		this.dequeue_user(user.id);
	}
}
