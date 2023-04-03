import { AppController } from "./controllers/app.controller";
import { Player } from "src/entities/Player";
import { GameState } from "src/entities/GameState";
import { Reflector } from "@nestjs/core";
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { GameGateway } from "./gateways/game.gateway";
import { AuthController } from "./auth/auth.controller";
import { TotpController } from "./auth/totp.controller";
import { DebugController } from "./controllers/debug.controller";
import { UserIDController, UserUsernameController, UserMeController, } from "./controllers/user.controller";
import { DataSource } from "typeorm";
import { HOST, DB_PORT, DB_USER, DB_PASS } from "./vars";
import { HttpAuthGuard } from "./auth/auth.guard";
import * as session from "express-session";
import { SESSION_SECRET, SESSION_ABSOLUTE_TIMEOUT, DB_DATABASE } from "./vars";
import { UserMiddleware } from "src/middleware/user.middleware";
import { RoomMiddleware } from "./middleware/room.middleware";
import { ChatController } from "./controllers/chat.controller";
import { MemberMiddleware } from "./middleware/member.middleware";
import { ActivityMiddleware } from "./middleware/activity.middleware";
import { UpdateGateway } from "./gateways/update.gateway";
import { User } from "./entities/User";
import { GameController } from "./controllers/game.controller";
import { SessionService } from "src/services/session.service";
import * as Pool from "pg-pool";
import { SessionExpiryMiddleware } from "./middleware/session.expire.middleware";
import { SetupGuard } from "src/guards/setup.guard";
import { Room } from "./entities/Room";
import { getRoomService } from "./services/room.service";
import { Repository } from "typeorm";
import { RoomInvite } from "./entities/RoomInvite";
import { HttpModule } from "@nestjs/axios";
import { MediaController } from "src/controllers/media.controller";
import { EntitySubscriber } from "src/subscribers/entity.subscriber"
import { ReceiverFinder } from "src/ReceiverFinder"
import { RateLimitMiddleware } from "src/middleware/ratelimit.middleware";
import { BotController } from "src/controllers/bot.controller";
import { AchievementService } from "src/services/achievement.service";
import { UserService } from "src/services/user.service";
import { MatchController } from "src/controllers/match.controller";
import { ChatRoom } from "src/entities/ChatRoom";
import { ChatRoomMember } from "src/entities/ChatRoomMember";
import { GenericRoomService } from "src/services/new.room.service";
import { GameRoomService } from "src/services/gameroom.service";
import { NewGameController } from "src/controllers/new.game.controller";
import { GameRoom } from "src/entities/GameRoom";
import { GameRoomMember } from "src/entities/GameRoomMember";
import { RoomInviteService } from "src/services/roominvite.service";
import { NewChatRoomController } from "src/controllers/chatroom.controller";
import { ChatRoomService } from "src/services/chatroom.service";
import type { Message } from "src/entities/Message";

export const db_pool = new Pool({
	database: DB_DATABASE,
	user: DB_USER,
	password: DB_PASS,
	port: DB_PORT,
	ssl: false, //TODO set to true
	max: 20,
	idleTimeoutMillis: 1000,
	connectionTimoutMillis: 1000,
	maxUses: 7500,
});

const entityFiles = [
	"./entities/User",
	"./entities/FriendRequest",
	"./entities/Message",
	"./entities/ChatRoom",
	"./entities/RoomInvite",
	"./entities/Invite",
	"./entities/Room",
	"./entities/Member",
	"./entities/GameRoom",
	"./entities/ChatRoomMember",
	"./entities/GameRoomMember",
	"./entities/Team",
	"./entities/Player",
	"./entities/GameState",
	"./entities/Embed",
	"./entities/MatchHistory",
	"./entities/Achievement",
	"./entities/AchievementProgress",
	"./entities/Objective",
	"./entities/AchievementView",
];

export const session_store = new (require("pg-session-store")(session))({
	pool: db_pool,
	createTableIfMissing: true,
});

export const sessionMiddleware = session({
	store: session_store,
	secret: SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: SESSION_ABSOLUTE_TIMEOUT,
		sameSite: "strict",
		//TODO set secure attribute
	},
});

export const dataSource = new DataSource({
	type: "postgres",
	host: HOST,
	port: DB_PORT,
	username: DB_USER,
	password: DB_PASS,
	database: DB_DATABASE,
	poolSize: 20,
	entities: entityFiles.map((file: string) => {
		const entity = require(file);
		return Object.values(entity)[0] as Function;
	}),
	subscribers: [EntitySubscriber],
	synchronize: true, //TODO disable and test before turning in
	//logging: true,
	// TODO enable cache? (cache: true)
});

const databaseProviders = [
	{
		provide: "DATA_SOURCE",
		useFactory: async () => {
			return await dataSource.initialize();
		},
	},
	{
		provide: "SESSION_SOURCE",
		useFactory: () => {
			return session_store;
		},
	},
];

const entityClasses = entityFiles.map<Function>(value => {
	const entity = require(value);
	return Object.values(entity)[0] as Function
});

const entityProviders = entityFiles.map<{
	provide: any;
	useFactory: any;
	inject: any;
}>((value: string) => {
	const entity = require(value);
	const clazz = Object.values(entity)[0] as Function;
	const name = Object.keys(entity)[0].toUpperCase() + "_REPO";
	return {
		provide: name,
		useFactory: (dataSource: DataSource) => {
			return dataSource.getRepository(clazz)
		},
		inject: ["DATA_SOURCE"],
	};
});

const roomServices = entityClasses.filter((value: any) => value.__proto__ === Room || value.name == "Room").map(value => {//TODO remove
	const name = value.name.toUpperCase();
	return {
		provide: name + "_PGPSERVICE",
		useFactory: (room_repo: any, member_repo: Repository<any>, invite_repo: Repository<RoomInvite>, user_repo: Repository<User>) => {
			const tmp = getRoomService(room_repo, member_repo, invite_repo, user_repo, value as any, entityClasses.find(clazz => clazz.name === (value.name + "Member")) as any);
			return tmp;
		},
		inject: [name + "_REPO", (name == "ROOM" ? "" : name) + "MEMBER_REPO", "ROOMINVITE_REPO", "USER_REPO"]
	};
});

const services = [
	{
		provide: "CHATROOM_SERVICE",
		useFactory: (
			room_repo: Repository<ChatRoom>,
			member_repo: Repository<ChatRoomMember>,
			message_repo: Repository<Message>,
		) => {
			return new ChatRoomService(room_repo, member_repo, message_repo);
		},
		inject: ["CHATROOM_REPO", "CHATROOMMEMBER_REPO", "MESSAGE_REPO"],
	},
	{
		provide: "GAMEROOM_SERVICE",
		useFactory: (
			room_repo: Repository<GameRoom>,
			member_repo: Repository<GameRoomMember>,
			state_repo: Repository<GameState>,
			player_repo: Repository<Player>,
		) => {
			return new GameRoomService(room_repo, member_repo, state_repo, player_repo);
		},
		inject: ["GAMEROOM_REPO", "GAMEROOMMEMBER_REPO", "GAMESTATE_REPO", "PLAYER_REPO"],
	},
];

@Module({
	imports: [
		HttpModule.registerAsync({
			useFactory: () => ({
				timeout: 5000,
				maxRedirects: 10,
			})
		}),
	],
	controllers: [
		AppController,
		AuthController,
		BotController,
		//ChatController,
		DebugController,
		//GameController,
		TotpController,
		MediaController,
		NewGameController,
		UserMeController,
		UserIDController,
		UserUsernameController,
		MatchController,
		NewChatRoomController,
	],
	providers: [
		GameGateway,
		HttpAuthGuard,
		UpdateGateway,
		SessionService,
		SetupGuard,
		ReceiverFinder,
		AchievementService,
		UserService,
		GameRoomService,
		RoomInviteService,
		...databaseProviders,
		...entityProviders,
		...roomServices,
		...services,
	],
	exports: [
		...databaseProviders,
	],
})
export class AppModule implements NestModule {
	// TODO: remove debug exeption
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(UserMiddleware, ActivityMiddleware)
			.exclude(
				{ path: "oauth(.*)", method: RequestMethod.ALL },
				{ path: "debug(.*)", method: RequestMethod.ALL })
			.forRoutes("*");
		consumer.apply(SessionExpiryMiddleware)
			.exclude(
				{ path: "debug(.*)", method: RequestMethod.ALL })
			.forRoutes("*");
		consumer.apply(RateLimitMiddleware).forRoutes("media/*");
		consumer.apply(RoomMiddleware, MemberMiddleware).forRoutes(NewChatRoomController, NewGameController);
	}
}
