import { GenericRoomController, GetRoom, GetMember } from "src/controllers/new.room.controller"
import { Response } from "express";
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { CreateRoomOptions } from "src/services/new.room.service";
import { Gamemode } from "src/enums";
import { Get } from "@nestjs/common";
import { GameRoomService } from "src/services/gameroom.service";
import { RoomInviteService } from "src/services/roominvite.service";
import { IsString, Length, IsOptional, IsBoolean, IsEnum, IsNumber } from "class-validator";
import { Post, Patch, Param, Body, ForbiddenException, Res, HttpCode, HttpStatus, UsePipes, ValidationPipe } from "@nestjs/common";
import { Me, ParseOptionalIDPipe, ParseIDPipe } from "src/util";
import { Player } from "src/entities/Player";
import { ERR_PERM } from "src/errors";
import { Team } from "src/entities/Team";
import { User } from "src/entities/User";
import { Role } from "src/enums";
import { RequiredRole } from "src/guards/role.guard";
import { UpdateGateway } from "src/gateways/update.gateway";
import { instanceToPlain } from "class-transformer"

class CreateGameRoomOptions implements CreateRoomOptions {
	@IsString()
	@Length(3, 20)
	@IsOptional()
	name?: string;

	@IsBoolean()
	@IsOptional()
	is_private?: boolean;

	@IsString()
	@IsOptional()
	@Length(1, 500)
	password?: string;

	@IsEnum(Gamemode)
	gamemode: Gamemode;

	@IsNumber()
	players: number;
}

class EditOptions implements Partial<CreateGameRoomOptions> {
	@IsString()
	@Length(3, 20)
	@IsOptional()
	name: string;

	@IsBoolean()
	@IsOptional()
	is_private?: boolean;

	@IsString()
	@IsOptional()
	@Length(1, 500)
	password?: string;

	@IsEnum(Gamemode)
	@IsOptional()
	gamemode: Gamemode;

	@IsNumber()
	@IsOptional()
	players: number;
};

class EditMemberDTO implements Partial<GameRoomMember> {};

export class NewGameController extends GenericRoomController(GameRoom, GameRoomMember, CreateGameRoomOptions, EditOptions, EditMemberDTO, "game") {

	constructor(
		private readonly game_service: GameRoomService,
		invite_service: RoomInviteService,
	) {
		super(game_service, invite_service);
	}

	@Post()
	@UsePipes(new ValidationPipe({ expectedType: CreateGameRoomOptions }))
	async create_room(@Me() me: User, @Body() dto: CreateGameRoomOptions) {
		const room = await super.create_room(me, dto);

		this.update(room, { state: { ... instanceToPlain(room.state) } });

		return room;
	}

	@Patch(":id/team/me")
	@RequiredRole(Role.MEMBER)
	async change_my_team(
		@GetMember() member: GameRoomMember,
		@Res() response: Response
	) {
		response.redirect(`${member.id}`);
	}

	@Patch(":id/team(s)?/:target")
	@RequiredRole(Role.MEMBER)
	async change_team(
		@Me() me: User,
		@GetRoom() room: GameRoom,
		@GetMember() member: GameRoomMember,
		@Param("target", ParseIDPipe(GameRoomMember)) target: GameRoomMember,
		@Body("team", ParseOptionalIDPipe(Team)) team?: Team
	) {
		if ((target.role >= member.role && target.user.id !== me.id) || (member.role < Role.ADMIN && room.state.teamsLocked)) {
			throw new ForbiddenException(ERR_PERM);
		}

		if (!member.player) {
			member.player = await this.game_service.get_players(room, me);
		}

		if (!member.player && team) {
			member.player = new Player;
			member.player.user = member.user;
		}

		if (team) {
			member.player.team = team;
		}

		if (!team && member.player) {
			await this.game_service.remove_players(member.player);

			member.player = null;
		}
		await this.game_service.save_members(member);

		await UpdateGateway.instance.send_state_update(me, room);
	}

	@Get(":id/state")
	async get_state(
		@GetRoom() room: GameRoom,
	) {
		return this.game_service.get_state(room);
	}

	@Post(":id/lock")//TODO this should probably be PUT
	@RequiredRole(Role.OWNER)
	@HttpCode(HttpStatus.NO_CONTENT)
	async lock_teams(
		@GetRoom() room: GameRoom,
	) {
		await this.game_service.save_states({ id: room.state.id, teamsLocked: true });
	}
}
