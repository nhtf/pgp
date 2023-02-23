import { Get, Patch, Param, Body, BadRequestException, ForbiddenException, Inject, ParseIntPipe } from "@nestjs/common";
import { GenericRoomController, CreateRoomDTO } from "src/services/room.service";
import { GameRoom } from "src/entities/GameRoom";
import { IsEnum } from "class-validator";
import { Gamemode } from "src/enums/Gamemode";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { GameState } from "src/entities/GameState";
import { Team } from "src/entities/Team";
import { Player } from "src/entities/Player";
import { User } from "src/entities/User";
import { RoomInvite } from "src/entities/RoomInvite";
import { RequiredRole, GetMember, GetRoom, IRoomService } from "src/services/room.service";
import { Role } from "src/enums/Role";
import { Repository } from "typeorm";
import { ParseIDPipe, ParseOptionalIDPipe } from "src/util";
import { ERR_NOT_MEMBER, ERR_PERM } from "src/errors";
import { UpdateGateway } from "src/gateways/update.gateway";
import { Me } from "src/util"

class CreateGameRoomDTO extends CreateRoomDTO {
	@IsEnum(Gamemode)
	gamemode: Gamemode;
}

const playerNumbers = new Map([
	[Gamemode.REGULAR, 2],
	[Gamemode.VR, 2],
	[Gamemode.MODERN, 2],
	[Gamemode.MODERN4P, 4],
])

const numbers = [ "one", "two", "three", "four"];

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
		@Inject("GAMEROOM_PGPSERVICE")
		service: IRoomService<GameRoom>,
		update_service: UpdateGateway,
	) {
		super(room_repo, member_repo, invite_repo, service, update_service);
	}

	async setup_room(room: GameRoom, dto: CreateGameRoomDTO) {
		const state = new GameState(dto.gamemode);

		state.teams = [];

		for (let i = 0; i < playerNumbers.get(state.gamemode)!; i++) {
			state.teams.push(new Team(`team ${numbers[i]}`));
		}

		room.state = state;
	}

	async get_joined_info(room: GameRoom): Promise<GameRoom> {
		return await this.room_repo.findOne({
			where: {
				id: room.id,
			},
			relations: {
				members: {
					user: true,
				},
				state: {
					teams: true,
				},
			},
		});
	}

	@Get("joined")
	async joined(@Me() me: User) {
		const members = await this.member_repo.find({
			where: {
				user: {
					id: me.id,
				},
			},
			relations: {
				room: {
					members: {
						user: true,
					},
					state: {
						teams: true,
					},
				},
			},
		});

		return members;
	}

	@Get("joined/id/:id")
	async joined_id(@Me() me: User, @Param("id", ParseIntPipe) id: number) {
		const members = await this.member_repo.findOne({
			where: {
				room: {
					id,
				},
				user: {
					id: me.id,
				},
			},
			relations: {
				room: {
					members: {
						user: true,
					},
					state: {
						teams: true,
					},
				},
			},
		});

		return members;
	}

	@Patch("id/:id/team/:target")
	@RequiredRole(Role.MEMBER)
	async change_team(
		@GetMember() member: GameRoomMember,
		@GetRoom() room: GameRoom,
		@Param("target", ParseIDPipe(GameRoomMember, { user: true })) target: GameRoomMember,
		@Body("team", ParseOptionalIDPipe(Team)) team?: Team,
	) {
		if (member.room.id !== room.id) {
			throw new BadRequestException(ERR_NOT_MEMBER);
		}
	
		if ((target.role >= member.role && target.user.id != member.user.id) || (member.role < Role.ADMIN && room.state.teamsLocked)) {
			throw new ForbiddenException(ERR_PERM);
		}

		if (team) {
			if (!member.player) {
				let player = await this.player_repo.findOneBy({ 
					user: { 
						id: member.user.id
					},
					team: {
						state: {
							id: room.state.id
						}
					}
				});

				if (player) {
					member.player = player;
				} else {
					member.player = new Player();
					member.player.user = member.user;
				}
			}

			member.player.team = team;
		} else {
			member.player = null;
		}
	
		return await this.member_repo.save(member);
	}
}
