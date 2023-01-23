import { AppController } from './controllers/app.controller';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { AuthController } from './auth/auth.controller';
import { TotpController } from './auth/totp.controller';
import { DebugController } from './controllers/debug.controller';
import { SessionUtils } from './SessionUtils';
import { AccountController } from './controllers/account.controller';
import { UserIDController, UserUsernameController, UserMeController, } from './controllers/user.controller';
import { DataSource } from 'typeorm';
import { HOST, DB_PORT, DB_USER, DB_PASS } from './vars';
import { GameController } from './controllers/game.controller';
import { AuthGuard } from './auth/auth.guard';
import * as session from 'express-session';
import { SESSION_SECRET } from './vars';

import { TestController } from './RoomService';
import { UserMiddleware } from './Middleware/UserMiddleware';
import { RoomMiddleware } from './Middleware/RoomMiddleware';
import { ChatRoomController } from './controllers/chatroom.controller';
import { RoomGateway } from './gateways/room.gateway';
import { MemberMiddleware } from './Middleware/MemberMiddleware';

const entityFiles = [
	'./entities/User',
	'./entities/FriendRequest',
	'./entities/Message',
	'./entities/ChatRoom',
	'./entities/GameRequest',
	'./entities/RoomInvite',
	"./entities/Invite",
	"./entities/Room",
	"./entities/Member",
	"./entities/GameRoom",
];

export const sessionMiddleware = session({
	store: new (require('connect-pg-simple')(session))({
		//TODO this is probably not the right way to connect to the database for sessions
		conString: 'postgres://postgres:postgres@localhost:5432/dev',
		createTableIfMissing: true,
	}),
	secret: SESSION_SECRET,
	resave: true,
	saveUninitialized: false,
	cookie: {
		maxAge: 72000000, //TODO set the right maxAge
		sameSite: 'strict',
		//TODO set secure attribute
	},
});

export const dataSource = new DataSource({
	type: 'postgres',
	host: HOST,
	port: DB_PORT,
	//TODO use env variables here
	username: DB_USER,
	password: DB_PASS,
	database: 'dev',
	entities: entityFiles.map<Function>(
		(value: string, index: number, array: string[]) => {
			const entity = require(value);
			const clazz = Object.values(entity)[0] as Function;
			return clazz;
		},
	),
	synchronize: true,
	// logging: true,
});

const databaseProviders = [
	{
		provide: 'DATA_SOURCE',
		useFactory: async () => {
			return dataSource.initialize();
		},
	},
];

const entityProviders = entityFiles.map<{
	provide: any;
	useFactory: any;
	inject: any;
}>((value: string, index: number, array: string[]) => {
	const entity = require(value);
	const clazz = Object.values(entity)[0] as Function;
	const name = Object.keys(entity)[0].toUpperCase() + '_REPO';
	const repo = dataSource.getRepository(clazz);
	return {
		provide: name,
		useFactory: (dataSource: DataSource) => dataSource.getRepository(clazz),
		inject: ['DATA_SOURCE'],
	};
});

@Module({
	imports: [
		/*TypeOrmModule.forRoot({ type: 'postgres', username: 'postgres', password: 'postgres', host: '172.19.0.2' }),*/
	],
	controllers: [
		AppController,
		AuthController,
		TotpController,
		AccountController,
		DebugController,
		GameController,
		UserIDController,
		UserMeController,
		UserUsernameController,
		ChatRoomController,
		TestController, //TODO remove
	],
	providers: [
		GameGateway,
		RoomGateway,
		SessionUtils,
		AuthGuard,
		...databaseProviders,
		...entityProviders,
	],
	exports: [...databaseProviders],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(UserMiddleware).exclude(
			{ path: "oauth(.*)", method: RequestMethod.ALL },
			{ path: "debug(.*)", method: RequestMethod.ALL 
		}).forRoutes("*");
		consumer.apply(RoomMiddleware, MemberMiddleware).forRoutes(ChatRoomController);
	}
}
