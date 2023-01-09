import { AppController } from './app.controller';
import { Module, Inject, Injectable } from '@nestjs/common';
import { WSConnection } from './wsconnection';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { TotpController } from './auth/totp.controller';
import { DebugController } from './debug.controller';
import { ChatRoomController } from './chat.controller';
import { SessionUtils } from './SessionUtils';
import { AccountController } from './account.controller';
import { DataSource, Repository } from 'typeorm';
import { HOST, DB_PORT, DB_USER, DB_PASS } from './vars';
import { GameController } from './game.controller';
import { AuthGuard } from './auth/auth.guard';
import { UserService } from './UserService';
import { User } from './entities/User';

const entityFiles = [
	'./entities/User',
	'./entities/FriendRequest',
	'./entities/Message',
	'./entities/ChatRoom',
	'./entities/GameRequest',
	'./entities/RoomInvite'
];

// TODO: move all entities to directory
export const dataSource = new DataSource({
	type: 'postgres',
	host: HOST,
	port: DB_PORT,
	//TODO use env variables here
	username: DB_USER,
	password: DB_PASS,
	database: 'dev',
	entities: entityFiles.map<Function>((value: string, index: number, array: string[]) => {
		const entity = require(value);
		const clazz = Object.values(entity)[0] as Function;
		return clazz;
	}),
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

const entityProviders = entityFiles.map<{ provide: any, useFactory: any, inject: any }>((value: string, index: number, array: string[]) => {
	const entity = require(value);
	const clazz = Object.values(entity)[0] as Function;
	const name = Object.keys(entity)[0].toUpperCase() + '_REPO';
	const repo = dataSource.getRepository(clazz);
	return {
		//provide: Repository<clazz.type>,
		provide: name,
		useFactory: (dataSource: DataSource) => dataSource.getRepository(clazz),
		inject: ['DATA_SOURCE'],
	};
});

@Module({
	imports: [
		/*TypeOrmModule.forRoot({ type: 'postgres', username: 'postgres', password: 'postgres', host: '172.19.0.2' }),*/
	],
	controllers: [AppController, AuthController, TotpController, AccountController, DebugController, GameController, ChatRoomController],
	providers: [WSConnection, SessionUtils, UserService, AuthGuard, ...databaseProviders, ...entityProviders],
	exports: [...databaseProviders]
})
export class AppModule { }
