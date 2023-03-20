import { Get, Post, Patch, Param, Body, BadRequestException, ForbiddenException, Inject } from "@nestjs/common";
import { GenericRoomController, CreateRoomDTO } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";
import { IsEnum, IsNumber } from "class-validator";
import { Gamemode, Role } from "src/enums";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { GameState } from "src/entities/GameState";
import { Team } from "src/entities/Team";
import { Player } from "src/entities/Player";
import { User } from "src/entities/User";
import { RoomInvite } from "src/entities/RoomInvite";
import { GetRoom, GetMember, IRoomService } from "src/services/room.service";
import { Repository, In, SelectQueryBuilder } from "typeorm";
import { ParseIDPipe, ParseOptionalIDPipe } from "src/util";
import { ERR_NOT_MEMBER, ERR_PERM } from "src/errors";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Me, parseId } from "src/util"
import { instanceToPlain } from "class-transformer"
import { RequiredRole } from "src/guards/role.guard"


class CreateGameRoomDTO extends CreateRoomDTO {
	@IsEnum(Gamemode)
	gamemode: Gamemode;

	@IsNumber()
	players: number;
}

const playerNumbers = new Map([
	[Gamemode.CLASSIC, [2]],
	[Gamemode.VR, [2]],
	[Gamemode.MODERN, [2, 4]],
])

// TODO...
const numbers = ["one", "two", "three", "four"];

export class GameController extends GenericRoomController<GameRoom, GameRoomMember>(GameRoom, GameRoomMember, "game", CreateGameRoomDTO) {
	// ODOT: copied from room.service.ts (what is even the point)
	constructor(
		@Inject("GAMEROOM_REPO")
		room_repo: Repository<GameRoom>,
		@Inject("GAMEROOMMEMBER_REPO")
		member_repo: Repository<GameRoomMember>,
		@Inject("ROOMINVITE_REPO")
		invite_repo: Repository<RoomInvite>,
		@Inject("PLAYER_REPO")
		readonly player_repo: Repository<Player>,
		@Inject("TEAM_REPO")
		readonly teamRepo: Repository<Team>,
		@Inject("GAMESTATE_REPO")
		readonly gamestate_repo: Repository<GameState>,
		@Inject("GAMEROOM_PGPSERVICE")
		service: IRoomService<GameRoom, GameRoomMember>,
		update_service: UpdateGateway,
	) {
		super(room_repo, member_repo, invite_repo, service, update_service);
	}

	async beforeJoin(room: GameRoom, body: any) {
		let team: Team;
	
		if (body.id === undefined) {
			throw new BadRequestException("Missing team id");
		}

		if (body.id === null) {
			return ;
		}
	
		try {
			team = await parseId(Team, body.id, this.teamRepo);
		} catch (error) {
			throw new BadRequestException("Not a valid team id");
		}

		if (team.stateId !== room.state.id) {
			throw new BadRequestException("Team of another room");
		}
	}

	async onJoin(room: GameRoom, member: GameRoomMember, body: any) {
		const id = body.id;
	
		if (id ) {
			const player = new Player;
	
			player.team = await parseId(Team, id, this.teamRepo);
			player.user = member.user;
			player.member = member;

			await this.player_repo.save(player);
			// await this.member_repo.save({ id: member.id, player });
		}
	}

	onCreate(room: GameRoom, dto: CreateGameRoomDTO) {
		const playerOptions = playerNumbers.get(dto.gamemode);
		const state = new GameState;

		state.gamemode = dto.gamemode;
		state.teams = [];

		if (!playerOptions || !playerOptions.includes(dto.players)) {
			throw new BadRequestException("Invalid amount of players");
		}

		for (let i = 0; i < dto.players; i++) {
			const team = new Team;

			team.name = `team ${numbers[i]}`;
			state.teams.push(team);
		}

		room.state = state;
	}

	relations(qb: SelectQueryBuilder<GameRoom>): SelectQueryBuilder<GameRoom> {
		return qb
			.leftJoinAndSelect("room.state", "state")
			.leftJoinAndSelect("state.teams", "team")
			.leftJoinAndSelect("team.players", "player")
			.leftJoinAndSelect("player.user", "user")
	}

	@Get("id/:id")
	@RequiredRole(Role.MEMBER)
	async get_room(@Me() me: User, @Param("id", ParseIDPipe(GameRoom, { members: { player: { team: true } } })) room: GameRoom) {
		return { ...instanceToPlain(room), joined: true, self: room.self(me) }
	}

	// TODO: One query
	@Get("history")
	async history(@Me() me: User) {
		const states = await this.gamestate_repo.find({
			where: {
				teams: {
					players: {
						user: {
							id: me.id,
						}
					}
				}
			},
		});

		const ids = states.map((state) => state.id);

		return await this.gamestate_repo.find({
			where: {
				id: In(ids)
			},
			relations: {
				teams: {
					players: {
						user: true,
					}
				}
			},
		});
	}

	@Patch("id/:id/team/:target")
	@RequiredRole(Role.MEMBER)
	async change_team(
		@Me() me: User,
		@GetMember() member: GameRoomMember,
		@GetRoom() room: GameRoom,
		@Param("target", ParseIDPipe(GameRoomMember)) target: GameRoomMember,
		@Body("team", ParseOptionalIDPipe(Team)) team?: Team,
	) {
		if ((target.role >= member.role && target.user.id !== me.id) || (member.role < Role.ADMIN && room.state.teamsLocked)) {
			throw new ForbiddenException(ERR_PERM);
		}

		if (!member.player && team) {
			member.player = new Player;
			member.player.user = member.user;
		}

		if (team) {
			member.player.team = team;
		} 
	
		if (!team && member.player) {
			await this.player_repo.remove(member.player);

			member.player = null;
		}

		await this.member_repo.save(member);
	}

	@Get("id/:id/state")
	async state(@GetRoom() room: GameRoom) {
		return this.gamestate_repo.findOneBy({ room: { id: room.id } });
	}

	@Post("id/:id/lock")
	@RequiredRole(Role.OWNER)
	async lock(@GetRoom() room: GameRoom) {
		await this.gamestate_repo.save({ id: room.state.id, teamsLocked: true });
	}
}
