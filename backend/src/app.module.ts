import { AppController } from "./controllers/app.controller";
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
import { ChatRoomController } from "./controllers/chat.controller";
import { RoomGateway } from "./gateways/room.gateway";
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
];

export const session_store = new (require("pg-session-store")(session))({
	pool: db_pool,
	createTableIfMissing: true,
});

export const sessionMiddleware = session({
	store: session_store,
	secret: SESSION_SECRET,
	resave: true,
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
	//TODO use env variables here
	username: DB_USER,
	password: DB_PASS,
	database: "dev",
	entities: entityFiles.map((file: string) => {
		const entity = require(file);
		return Object.values(entity)[0] as Function;
	}),
	subscribers: [EntitySubscriber],
	synchronize: true, //TODO disable and test before turning in
	// logging: true,
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
		useFactory: (dataSource: DataSource) => dataSource.getRepository(clazz),
		inject: ["DATA_SOURCE"],
	};
});

const roomServices = entityClasses.filter((value: any) => value.__proto__ === Room).map(value => {
	const name = value.name.toUpperCase();
	return {
		provide: name + "_PGPSERVICE",
		useFactory: (room_repo: any, member_repo: Repository<any>, invite_repo: Repository<RoomInvite>, user_repo: Repository<User>) => {
			const tmp = getRoomService(room_repo, member_repo, invite_repo, user_repo, value as any, entityClasses.find(clazz => clazz.name === (value.name + "Member")) as any);
			return tmp;
		},
		inject: [name + "_REPO", name + "MEMBER_REPO", "ROOMINVITE_REPO", "USER_REPO"]
	};
});

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
		TotpController,
		DebugController,
		GameController,
		UserMeController,
		UserIDController,
		UserUsernameController,
		ChatRoomController,
		MediaController,
	],
	providers: [
		GameGateway,
		RoomGateway,
		UpdateGateway,
		HttpAuthGuard,
		SessionService,
		SetupGuard,
		ReceiverFinder,
		...databaseProviders,
		...entityProviders,
		...roomServices,
	],
	exports: [
		...databaseProviders,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(SessionExpiryMiddleware).exclude(
			{ path: "debug(.*)", method: RequestMethod.ALL }).forRoutes("*");
		consumer.apply(UserMiddleware).exclude(
			{ path: "oauth(.*)", method: RequestMethod.ALL },
			{ path: "debug(.*)", method: RequestMethod.ALL })
			.forRoutes("*");
		consumer.apply(RoomMiddleware, MemberMiddleware).forRoutes(ChatRoomController);
		consumer.apply(RoomMiddleware, MemberMiddleware).forRoutes(GameController);
		consumer.apply(ActivityMiddleware).exclude(
			{ path: "oauth(.*)", method: RequestMethod.ALL },
			{ path: "debug(.*)", method: RequestMethod.ALL })
			.forRoutes("*");
	}
}
