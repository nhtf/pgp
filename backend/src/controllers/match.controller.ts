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
import { IsArray, ArrayNotEmpty, ArrayContains, ArrayUnique, IsEnum } from "class-validator";
import type { User } from "src/entities/User";

class GamemodesDTO {
	@IsArray()
	@ArrayNotEmpty()
	@IsEnum(Gamemode, { each: true })
	@ArrayUnique(o => {
		if (typeof o === "string")
			return Gamemode[o];
		return o;
	})
	gamemodes: Gamemode[];
}

@Controller("match")
@UseGuards(HttpAuthGuard, SetupGuard, HumanGuard)
export class MatchController {

	private readonly queue: Map<Gamemode, number> = new Map();

	constructor(
		@Inject("USER_REPO")
		private readonly user_repo: Repository<User>,
		@Inject("GAMEROOM_PGPSERVICE")
		private readonly room_service: IRoomService<GameRoom, GameRoomMember>,
		private readonly update_service: UpdateGateway,
	) {}

	async make_match(a: User, b: User, gamemode: Gamemode) {
	}
	
	dequeue_if(predicate: (gamemode: Gamemode, id: number) => boolean) {
		for (const [key, value] of this.queue.entries()) {
			if (predicate(key, value))
				this.queue.delete(key);
		}
	}

	@Put("me")
	@HttpCode(HttpStatus.NO_CONTENT)
	async enqueue(
		@Me() user: User,
		@Body() dto: GamemodesDTO,
	) {
		for (const gamemode of dto.gamemodes) {
			const id = this.queue.get(gamemode);
			if (id === user.id)
				continue;
			if (id != undefined) {
				this.dequeue_if((_, value) => value == id);
				const other = await this.user_repo.findOneBy({ id });

				if (other != undefined) {
					const room = await this.room_service.create("", true);
					await this.room_service.add_member(room, user);
					await this.room_service.add_member(room, other);
					await this.room_service.save(room);

					const url = `${FRONTEND_ADDRESS}/game/${room.id}`;
					const message = "Found game";
					const can_cancel = true;
					this.update_service.send_update(create_packet(Subject.REDIRECT, Action.INSERT, user.id, { url, message, can_cancel }), user, other);
					return;
				}
			}
		}
		for (const gamemode of dto.gamemodes) {
			this.queue.set(gamemode, user.id);
		}
	}

	@Delete("me")
	@HttpCode(HttpStatus.NO_CONTENT)
	async dequeue(
		@Me() user: User,
		@Body() dto: GamemodesDTO
	) {
		this.dequeue_if((gamemode, id) => id === user.id && dto.gamemodes.includes(gamemode));
	}
}
