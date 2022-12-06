import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { WSConnection } from './wsconnection';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { TotpController } from './auth/totp.controller';
import { DebugController } from './debug.controller';
import { ChatRoomController } from './chat.controller';
import { SessionUtils } from './SessionUtils';
import { User, FriendRequest, GameRequest, UserService } from './UserService';
import { AccountController } from './account.controler';
import { DataSource } from 'typeorm';
import { HOST, DB_PORT, DB_USER, DB_PASS } from './vars';
import { GameController } from './game.controller';
import { ChatRoom, Message } from './Chat';
import { AuthGuard } from './auth/auth.guard';

// TODO: move all entities to directory
export const dataSource = new DataSource({
	type: 'postgres',
	host: HOST,
	port: DB_PORT,
	//TODO use env variables here
	username: DB_USER,
	password: DB_PASS,
	database: 'dev',
	entities: [User, FriendRequest, GameRequest, ChatRoom, Message],
	synchronize: true,
	logging: false,
});

const databaseProviders = [
	{
		provide: 'DATA_SOURCE',
		useFactory: async () => {
			return dataSource.initialize();
		}
	}
];

const entityProviders = [
	{
		provide: 'USER_REPO',
		useFactory: (dataSource: DataSource) => dataSource.getRepository(User), 
		inject: ['DATA_SOURCE'],
	},
	{
		provide: 'FRIEND_REQ_REPO',
		useFactory: (dataSource: DataSource) => dataSource.getRepository(FriendRequest),
		inject: ['DATA_SOURCE'],
	},
	{
		provide: 'CHAT_ROOM_REPO',
		useFactory: (dataSource: DataSource) => dataSource.getRepository(ChatRoom),
		inject: ['DATA_SOURCE'],
	}
];

@Module({
	imports: [
		/*TypeOrmModule.forRoot({ type: 'postgres', username: 'postgres', password: 'postgres', host: '172.19.0.2' }),*/
	],
	controllers: [AppController, AuthController, TotpController, AccountController, DebugController, GameController, ChatRoomController],
	providers: [WSConnection, SessionUtils, UserService, AuthGuard, ...databaseProviders, ...entityProviders],
	exports: [...databaseProviders]
})
export class AppModule { }
