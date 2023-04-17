import { GenericRoomController, GetRoom, GetMember } from "src/controllers/room.controller"
import { Response } from "express";
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { CreateRoomOptions } from "src/services/room.service";
import { Gamemode } from "src/enums";
import { Get, Put } from "@nestjs/common";
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
import { SelectQueryBuilder } from "typeorm"

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
};

class EditMemberDTO implements Partial<GameRoomMember> {};

export class NewGameController extends GenericRoomController(GameRoom, GameRoomMember, CreateGameRoomOptions, EditOptions, EditMemberDTO, "game") {

	constructor(
		private readonly game_service: GameRoomService,
		invite_service: RoomInviteService,
	) {
		super(game_service, invite_service);
	}

	relations(qb: SelectQueryBuilder<GameRoom>): SelectQueryBuilder<GameRoom> {
		return super.relations(qb)
			.leftJoinAndSelect("room.state", "state")
			.leftJoinAndSelect("state.teams", "team")
			.leftJoinAndSelect("team.players", "player");
	}

	@Post()
	@UsePipes(new ValidationPipe({ expectedType: CreateGameRoomOptions }))
	async create_room(@Me() me: User, @Body() dto: CreateGameRoomOptions) {
		const room = await super.create_room(me, dto);

		this.update(room, { state: { ... instanceToPlain(room.state) } });

		return room;
	}

	@Patch(":id/team/auto")
	@RequiredRole(Role.MEMBER)
	async autoteam(@Me() me: User, @GetRoom() room: GameRoom, @GetMember() member: GameRoomMember) {
		if (member.player) {
			throw new ForbiddenException("Already in a team");
		}

		const state = await this.game_service.get_state(room);
		const leastPlayers = state.teams.reduce((acc, cur) => {
			return cur.players.length < acc.players.length ? cur : acc;
		}, state.teams[0]);

		const player = new Player;

		player.user = me;
		player.team = leastPlayers;

		await this.game_service.save_members({ id: member.id, player } as GameRoomMember);

		await UpdateGateway.instance.send_state_update(me, room);
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
		if (target.role >= member.role && target.user.id !== me.id) {
			throw new ForbiddenException(ERR_PERM);
		}

		if (room.state.teamsLocked) {
			throw new ForbiddenException(ERR_PERM);
		}

		if (!member.player) {
			member.player = await this.game_service.get_players(room, me);
		}

		await this.game_service.set_team(member, team);
		await UpdateGateway.instance.send_state_update(me, room);
	}

	@Get(":id/state")
	async get_state(@GetRoom() room: GameRoom) {
		return this.game_service.get_state(room);
	}

	@Put(":id/lock")
	@RequiredRole(Role.OWNER)
	@HttpCode(HttpStatus.NO_CONTENT)
	async lock_teams(@GetRoom() room: GameRoom) {
		await this.game_service.lock_teams(room);
	}
}
