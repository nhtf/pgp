import { Inject } from "@nestjs/common";
import { User } from "src/entities/User";
import { Team } from "src/entities/Team";
import { GameState} from "src/entities/GameState"
import { MessageBody, SubscribeMessage, ConnectedSocket } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { Repository } from "typeorm"
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { ProtectedGateway } from "src/gateways/protected.gateway";
import { UpdateGateway } from "src/gateways/update.gateway"
import { Action, Subject } from "src/enums"
import { Gamemode } from "src/enums";
import { GameRoomService } from "src/services/gameroom.service";

type BroadcastData = {
	name: "update" | "synchronize" | "desync-check",
	snapshot: {
		state: {
			teams: Team[],
			finished: boolean,
		},
	},
	current: {
		state: {
			teams: Team[],
			finished: boolean,
		},
	},
	events: any[],
}

export class GameGateway extends ProtectedGateway("game") {
	constructor(
		@Inject("USER_REPO")
		readonly userRepo: Repository<User>,
		@Inject("GAMEROOM_REPO")
		private readonly roomRepo: Repository<GameRoom>,
		@Inject("GAMEROOMMEMBER_REPO")
		private readonly memberRepo: Repository<GameRoomMember>,
		@Inject("GAMESTATE_REPO")
		private readonly gameStateRepo: Repository<GameState>,
		@Inject("TEAM_REPO")
		private readonly teamRepo: Repository<Team>,
		private readonly game_service: GameRoomService,
	) {
		super(userRepo);
	}

	async onDisconnect(client: Socket) {
		await this.userRepo.save({ id: client.user, activeRoom: null });

		if (client.user == undefined) {
			client.emit("exception", { errorMessage: "unauthorized" });
			return;
		}

		UpdateGateway.instance.send_update({
			subject: Subject.USER,
			action: Action.UPDATE,
			id: client.user,
			value: { activeRoomId: null	}
		});

		// NOTE: this has a race condition, we don't care
		const state = await this.gameStateRepo.findOneBy({ room: { id: client.room } });
	
		if (state) {
			const active = await this.userRepo.countBy({ activeRoom: { id: client.room } });
	
			if (active === 0 && state.finished && !state.terminated) {
				await this.gameStateRepo.save({ id: state.id, terminated: true });
				await this.game_service.gameFinished(state);
			}
		}
	}

	async onJoin(client: Socket) {
		const user = await this.userRepo.save({ id: client.user, activeRoom: { id: client.room }});
	
		await client.join(String(client.room));
	
		UpdateGateway.instance.send_update({
			subject: Subject.USER,
			action: Action.UPDATE,
			id: user.id,
			value: { activeRoomId: client.room }
		});

		await UpdateGateway.instance.send_state_update(user, { id: client.room });
	}

	@SubscribeMessage("broadcast")
	async broadcast(@ConnectedSocket() client: Socket, @MessageBody() data: BroadcastData) {
		client.to(String(client.room)).emit("broadcast", data);

		if (data.name === "synchronize") {
			if (data.current.state.finished !== undefined) {
				const state = await this.gameStateRepo.findOneBy({ room: { id: client.room } });

				if (state != undefined && state.finished !== data.current.state.finished) {
					await this.gameStateRepo.save({ id: state.id, finished: data.current.state.finished });
				}
			}

			data.current.state.teams.forEach(async (team) => {
				const old = await this.teamRepo.findOneBy({ id: team.id });
			
				if (old != undefined && team.score !== old.score) {
					await this.teamRepo.save({ id: team.id, score: team.score });

					UpdateGateway.instance.send_update({
						subject: Subject.TEAM,
						action: Action.UPDATE,
						id: team.id,
						value: { stateId: old.stateId, score: team.score }
					});
				}
			});
		}
	}

	@SubscribeMessage("ping")
	ping(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
		client.emit("pong", data);
	}
}
