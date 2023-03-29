import { GenericRoomController } from "src/controllers/new.room.controller"
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { CreateRoomOptions } from "src/services/new.room.service";
import { Gamemode } from "src/enums";
import { Get, Controller } from "@nestjs/common";
import { GameRoomService } from "src/services/gameroom.service";
import { RoomInviteService } from "src/services/roominvite.service";

class CreateGameRoomOptions implements CreateRoomOptions {
	name: string;
	is_private?: boolean;
	password?: string;
	gamemode: Gamemode;
	players: number;
}

class EditOptions implements Partial<CreateGameRoomOptions> {};

export class NewGameController extends GenericRoomController(GameRoom, GameRoomMember, CreateGameRoomOptions, EditOptions, "game") {
}